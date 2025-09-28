import { hashContent } from '../hashing/sha1';
import { promises as fs } from 'fs';
import * as path from 'path';

export interface RawAssetInput {
  nodeId: string;
  name: string; // original layer name
  bytes: Buffer; // simulated content (future: fetched from Figma image API)
  ext: string; // .png | .svg etc (include leading dot)
}

export interface ExportAssetResult {
  filename: string; // final filename written
  contentHash: string; // 8 char hash
  path: string; // absolute file path
}

export interface ExportAssetsOptions {
  outDir: string; // directory to place assets
  dryRun?: boolean; // if true, do not write files
  onCollision?: (base: string, attempt: number) => void;
}

/**
 * Export assets producing deterministic hashed filenames: sanitized-base--hash.ext
 * Collision strategy: if filename already exists with different content, append -N before --hash.
 */
export async function exportAssets(inputs: RawAssetInput[], opts: ExportAssetsOptions): Promise<ExportAssetResult[]> {
  await fs.mkdir(opts.outDir, { recursive: true });
  const results: ExportAssetResult[] = [];

  for (const asset of inputs) {
    const baseSanitized = sanitizeBase(asset.name || 'asset');
    const contentHash = hashContent(asset.bytes);
    let attempt = 0;
    let filename: string;
    while (true) {
      const suffix = attempt === 0 ? '' : `-${attempt + 1}`; // start -2 for first collision
      filename = `${baseSanitized}${suffix}--${contentHash}${asset.ext}`;
      const target = path.join(opts.outDir, filename);
      const exists = await fileExists(target);
      if (!exists) {
        if (!opts.dryRun) await fs.writeFile(target, asset.bytes);
        results.push({ filename, contentHash, path: target });
        break;
      } else {
        // If exists, compare hash of existing content; if identical, reuse without increment
        const existing = await fs.readFile(target);
        const existingHash = hashContent(existing);
        if (existingHash === contentHash) {
          // identical content; deterministic reuse
            results.push({ filename, contentHash, path: target });
            break;
        }
        attempt++;
        opts.onCollision?.(baseSanitized, attempt);
        continue;
      }
    }
  }

  return results.sort((a, b) => a.filename.localeCompare(b.filename));
}

function sanitizeBase(name: string): string {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'asset'
  );
}

async function fileExists(p: string): Promise<boolean> {
  try { await fs.access(p); return true; } catch { return false; }
}
