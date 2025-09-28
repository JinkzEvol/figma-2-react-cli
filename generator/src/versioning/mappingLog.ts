import { promises as fs } from 'fs';
import * as path from 'path';

export interface MappingLogEntry {
  version: string;
  file: string;
  hash: string;
}

export interface MappingLogOptions {
  versionDir: string; // absolute path to current version directory
}

const MAPPING_LOG_FILE = 'mapping-log.txt';

/**
 * Append mapping log lines: version\tfile\thash (deterministic ordering up to caller).
 */
export async function appendMappingLog(opts: MappingLogOptions, entries: MappingLogEntry[]): Promise<void> {
  if (!entries.length) return;
  const lines = entries.map(e => `${e.version}\t${e.file}\t${e.hash}`).join('\n') + '\n';
  await fs.appendFile(path.join(opts.versionDir, MAPPING_LOG_FILE), lines, 'utf8');
}
