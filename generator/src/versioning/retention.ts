import { promises as fs } from 'node:fs';
import path from 'node:path';

const VERSION_DIR_REGEX = /^v(?<date>\d{8})-(?<time>\d{4})-(?<hash>[a-f0-9]{8})$/i;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface RunRetentionOptions {
  rootDir: string;
  keepLatest?: number;
  maxAgeDays?: number;
  dryRun?: boolean;
  confirm?: boolean;
  now?: Date;
  logger?: {
    info: (message: string) => void;
    warn?: (message: string) => void;
  };
}

export interface RetentionResult {
  candidates: string[];
  kept: string[];
  deleted: string[];
  dryRun: boolean;
}

interface VersionEntry {
  name: string;
  path: string;
  timestamp: Date;
  ageDays: number;
}

export async function runRetention(options: RunRetentionOptions): Promise<RetentionResult> {
  if (!options.rootDir) {
    throw new Error('rootDir is required for retention helper');
  }
  const dryRun = options.dryRun !== undefined ? options.dryRun : true;
  const logger = options.logger ?? { info: () => undefined, warn: () => undefined };
  const now = options.now ?? new Date();
  const keepLatest = normalizeKeep(options.keepLatest);
  const maxAgeDays = normalizeAge(options.maxAgeDays);

  const entries = await loadVersionEntries(options.rootDir, now);
  if (!entries.length) {
    logger.info('No version directories found – nothing to clean up.');
    return { candidates: [], kept: [], deleted: [], dryRun };
  }

  const candidates: VersionEntry[] = [];
  const kept: VersionEntry[] = [];

  entries.forEach((entry, index) => {
    const beyondKeep = keepLatest !== Infinity && index >= keepLatest;
    const olderThan = maxAgeDays !== undefined && entry.ageDays > maxAgeDays;
    if (beyondKeep || olderThan) {
      candidates.push(entry);
    } else {
      kept.push(entry);
    }
  });

  if (!candidates.length) {
    logger.info('All version directories fall within retention policy.');
    return {
      candidates: [],
      kept: entries.map((e) => e.path),
      deleted: [],
      dryRun
    };
  }

  candidates.forEach((candidate) => {
    const reasonParts: string[] = [];
    if (maxAgeDays !== undefined && candidate.ageDays > maxAgeDays) {
      reasonParts.push(`age=${candidate.ageDays}d > max=${maxAgeDays}d`);
    }
    if (keepLatest !== Infinity && entries.indexOf(candidate) >= keepLatest) {
      reasonParts.push(`rank>${keepLatest}`);
    }
    const reason = reasonParts.join('; ') || 'candidate';
    logger.info(`Retention candidate: ${candidate.name} (${reason})`);
  });

  if (!dryRun) {
    if (!options.confirm) {
      throw new Error('Refusing to delete without --yes confirmation. Re-run with confirm:true to proceed.');
    }
    const deleted: string[] = [];
    for (const candidate of candidates) {
      await fs.rm(candidate.path, { recursive: true, force: true });
      deleted.push(candidate.path);
      logger.info(`Deleted version directory: ${candidate.name}`);
    }
    return {
      candidates: candidates.map((c) => c.path),
      kept: kept.map((k) => k.path),
      deleted,
      dryRun
    };
  }

  return {
    candidates: candidates.map((c) => c.path),
    kept: kept.map((k) => k.path),
    deleted: [],
    dryRun
  };
}

function normalizeKeep(keep?: number): number {
  if (keep === undefined || keep === null) return Infinity;
  if (!Number.isFinite(keep) || keep < 0) return Infinity;
  return Math.floor(keep);
}

function normalizeAge(age?: number): number | undefined {
  if (age === undefined || age === null) return undefined;
  if (!Number.isFinite(age) || age < 0) return undefined;
  return Math.floor(age);
}

async function loadVersionEntries(rootDir: string, now: Date): Promise<VersionEntry[]> {
  const dirents = await fs.readdir(rootDir, { withFileTypes: true });
  const entries: VersionEntry[] = [];

  for (const dirent of dirents) {
    if (!dirent.isDirectory()) continue;
    const match = dirent.name.match(VERSION_DIR_REGEX);
    if (!match || !match.groups) continue;

    const timestamp = parseTimestamp(match.groups.date, match.groups.time);
    if (!timestamp) continue;

    const ageDays = Math.max(0, Math.floor((now.getTime() - timestamp.getTime()) / MS_PER_DAY));
    entries.push({
      name: dirent.name,
      path: path.join(rootDir, dirent.name),
      timestamp,
      ageDays
    });
  }

  return entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

function parseTimestamp(date: string, time: string): Date | null {
  const year = Number(date.slice(0, 4));
  const month = Number(date.slice(4, 6));
  const day = Number(date.slice(6, 8));
  const hour = Number(time.slice(0, 2));
  const minute = Number(time.slice(2, 4));
  if ([year, month, day, hour, minute].some((n) => Number.isNaN(n))) return null;
  return new Date(Date.UTC(year, month - 1, day, hour, minute));
}

if (require.main === module) {
  (async () => {
    try {
      const parsed = parseCliArgs(process.argv.slice(2));
      if (!parsed.rootDir) {
        console.error('Usage: ts-node retention.ts --root <path> [--keep <n>] [--max-age <days>] [--yes]');
        process.exit(1);
      }

      const yes = parsed.yes === true;
      const result = await runRetention({
        rootDir: path.resolve(parsed.rootDir),
        keepLatest: parsed.keep,
        maxAgeDays: parsed.maxAge,
        dryRun: !yes,
        confirm: yes,
        logger: console
      });

      if (result.candidates.length === 0) {
        console.log('Retention: no candidates matched the provided thresholds.');
      } else if (yes) {
        console.log(`Retention: deleted ${result.deleted.length} directories.`);
      } else {
        console.log(`Retention: ${result.candidates.length} directories would be deleted (dry-run).`);
      }
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  })();
}

function parseCliArgs(args: string[]): {
  rootDir?: string;
  keep?: number;
  maxAge?: number;
  yes?: boolean;
} {
  const parsed: { rootDir?: string; keep?: number; maxAge?: number; yes?: boolean } = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--root':
        parsed.rootDir = args[++i];
        break;
      case '--keep':
        parsed.keep = Number(args[++i]);
        break;
      case '--max-age':
        parsed.maxAge = Number(args[++i]);
        break;
      case '--yes':
        parsed.yes = true;
        break;
      case '--dry-run':
        parsed.yes = false;
        break;
      default:
        break;
    }
  }
  return parsed;
}
