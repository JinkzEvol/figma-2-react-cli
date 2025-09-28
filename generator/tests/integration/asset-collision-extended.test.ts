import { describe, expect, it } from '@jest/globals';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { exportAssets } from '../../src/assets';

describe('integration: asset collision extended', () => {
  it('increments suffix for repeated conflicting files and surfaces collision callbacks', async () => {
    const tmp = path.join(process.cwd(), 'generator', '.tmp-test-assets-collision-extended');
    await fs.rm(tmp, { recursive: true, force: true });
    await fs.mkdir(tmp, { recursive: true });

    const asset = { nodeId: '1', name: 'Icon Primary', bytes: Buffer.from('AAAA'), ext: '.svg' };

    const initial = await exportAssets([asset], { outDir: tmp });
    const firstFilename = initial[0].filename;
    const firstPath = path.join(tmp, firstFilename);

    // Corrupt original to force mismatch hash on refresh.
    await fs.writeFile(firstPath, Buffer.from('collision-one'));

    // Pre-seed a second conflicting file following the numeric suffix pattern so the exporter must try a third slot.
    const secondCandidate = firstFilename.replace('--', '-2--');
    await fs.writeFile(path.join(tmp, secondCandidate), Buffer.from('collision-two'));

    const collisions: Array<{ base: string; attempt: number }> = [];
    const rerun = await exportAssets([asset], {
      outDir: tmp,
      onCollision: (base, attempt) => collisions.push({ base, attempt })
    });

    expect(collisions).toEqual([
      { base: 'icon-primary', attempt: 1 },
      { base: 'icon-primary', attempt: 2 }
    ]);
    expect(rerun[0].filename).toBe(firstFilename.replace('--', '-3--'));

    // Final file should exist with expected bytes while previous conflicts remain untouched.
    const finalPath = path.join(tmp, rerun[0].filename);
    await expect(fs.readFile(finalPath)).resolves.toEqual(asset.bytes);
    await expect(fs.readFile(firstPath)).resolves.toEqual(Buffer.from('collision-one'));
    await expect(fs.readFile(path.join(tmp, secondCandidate))).resolves.toEqual(Buffer.from('collision-two'));
  });
});
