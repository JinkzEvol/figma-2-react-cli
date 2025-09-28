import { exportAssets } from '../../src/assets';
import { promises as fs } from 'fs';
import * as path from 'path';

describe('integration: asset collision', () => {
  test('different contents with same base name produce incremented suffix', async () => {
    const tmp = path.join(process.cwd(), 'generator', '.tmp-test-assets-collision');
    await fs.rm(tmp, { recursive: true, force: true });
    await fs.mkdir(tmp, { recursive: true });

    const a = { nodeId: '1', name: 'Icon', bytes: Buffer.from('A'), ext: '.svg' };
    const b = { nodeId: '2', name: 'Icon', bytes: Buffer.from('B'), ext: '.svg' }; // diff content → diff hash likely, but ensure suffix logic if hash collides artificially

    // Force same hash by overriding bytes? Instead simulate by copying bytes after first export to same hash path
    const run1 = await exportAssets([a], { outDir: tmp });

    // If we modify b to reuse same content to test identical reuse (no suffix)
    const bSame = { ...b, bytes: Buffer.from('A') };
    const run2 = await exportAssets([bSame], { outDir: tmp });
    expect(run2[0].filename).toEqual(run1[0].filename);

    // Now export with truly different bytes to enforce second distinct file name (since hash differs, no numeric suffix needed unless base+hash collision). To simulate collision strategy path, we artificially write a conflicting different content file with the target name then re-run export.
    const conflictingPath = path.join(tmp, run1[0].filename);
    await fs.writeFile(conflictingPath, Buffer.from('DIFFERENT')); // create conflicting file with different content
    const run3 = await exportAssets([a], { outDir: tmp });
    // Expect numeric suffix -2 pattern before --hash
    expect(run3[0].filename).toMatch(/icon-2--[a-f0-9]{8}\.svg$/);
  });
});
