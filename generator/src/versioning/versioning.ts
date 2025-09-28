import { promises as fs } from 'fs';
import * as path from 'path';
import { hashContent } from '../hashing/sha1';

export interface VersionRecordEntry {
  versionDir: string;
  baseComponent: string;
  runTimestamp: string;
  previousVersionDir: string | null;
  fileHashes: Record<string, string>;
}

export interface EnsureVersionDirResult {
  versionDir: string; // absolute path
  versionName: string; // vYYYYMMDD-HHMM-hash
  previousVersionDir: string | null;
}

export interface VersioningOptions {
  outParent: string; // parent directory where version dirs live
  baseComponent: string; // name of primary component for version map linking
}

const VERSION_MAP_FILE = 'version-map.json';

export async function ensureVersionDir(opts: VersioningOptions): Promise<EnsureVersionDirResult> {
  await fs.mkdir(opts.outParent, { recursive: true });
  const versionMapPath = path.join(opts.outParent, VERSION_MAP_FILE);
  const existing = await loadVersionMap(versionMapPath);
  const previousVersionDir = existing.length ? existing[existing.length - 1].versionDir : null;
  const now = new Date();
  const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
  const hashSeed = hashContent(Buffer.from(now.toISOString())).slice(0, 8);
  const versionName = `v${stamp}-${hashSeed}`;
  const versionDir = path.join(opts.outParent, versionName);
  await fs.mkdir(versionDir, { recursive: true });
  return { versionDir, versionName, previousVersionDir };
}

export async function updateVersionMap(opts: VersioningOptions, ensure: EnsureVersionDirResult, files: string[]): Promise<VersionRecordEntry[]> {
  const versionMapPath = path.join(opts.outParent, VERSION_MAP_FILE);
  const existing = await loadVersionMap(versionMapPath);
  const fileHashes: Record<string, string> = {};
  for (const f of files) {
    const data = await fs.readFile(f);
    fileHashes[path.basename(f)] = hashContent(data);
  }
  const entry: VersionRecordEntry = {
    versionDir: ensure.versionName,
    baseComponent: opts.baseComponent,
    runTimestamp: new Date().toISOString(),
    previousVersionDir: ensure.previousVersionDir,
    fileHashes
  };
  existing.push(entry);
  await fs.writeFile(versionMapPath, JSON.stringify(existing, null, 2));
  return existing;
}

async function loadVersionMap(p: string): Promise<VersionRecordEntry[]> {
  try {
    const txt = await fs.readFile(p, 'utf8');
    return JSON.parse(txt);
  } catch {
    return [];
  }
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}
