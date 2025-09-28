import { runPipeline } from '../../src/cli/run';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

function fileHash(p: string) {
  return fs.readFile(p).then(buf => crypto.createHash('sha1').update(buf).digest('hex'));
}

describe('integration: hash stability', () => {
  test('two identical runs emit identical component file content', async () => {
    const out = path.join(process.cwd(), 'generator', '.tmp-hash-stability');
    await fs.rm(out, { recursive: true, force: true });
    await fs.mkdir(out, { recursive: true });

    const run1 = await runPipeline({ file: 'FILE', node: 'NODE', out, variants: false, reuseComponents: false, overrideWarningThreshold: false, verboseTrace: false, disableHeadings: false });
  const entries1 = await fs.readdir(out, { withFileTypes: true });
  const version1Dir = entries1.filter(e => e.isDirectory() && e.name.startsWith('v'))[0].name;
  const comp1 = path.join(out, version1Dir, 'GeneratedComponent.v1.tsx');
    const hash1 = await fileHash(comp1);

    const run2 = await runPipeline({ file: 'FILE', node: 'NODE', out, variants: false, reuseComponents: false, overrideWarningThreshold: false, verboseTrace: false, disableHeadings: false });
  const entries2 = await fs.readdir(out, { withFileTypes: true });
  const versionDirs = entries2.filter(e => e.isDirectory() && e.name.startsWith('v')).map(e => e.name).sort();
    const version2Dir = versionDirs[versionDirs.length - 1];
    const comp2 = path.join(out, version2Dir, 'GeneratedComponent.v1.tsx');
    const hash2 = await fileHash(comp2);

    // Ensure content stable (current simplistic emitter); version directories differ but file content should match
    expect(hash1).toEqual(hash2);
  });
});
