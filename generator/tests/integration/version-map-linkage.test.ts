import { describe, test, expect } from '@jest/globals';
import { runPipeline } from '../../src/cli/run';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * T020 Version map linkage test (scaffold)
 */

describe('integration: version map linkage', () => {
  test('second run links previous versionDir', async () => {
    const out = path.resolve('generated-version-linkage');
    const run1 = await runPipeline({ file: 'F', node: 'root', out, variants: false, reuseComponents: false, overrideWarningThreshold: false, verboseTrace: false, disableHeadings: false } as any);
    expect(run1.exitCode).toBe(0);
    const run2 = await runPipeline({ file: 'F', node: 'root', out, variants: false, reuseComponents: false, overrideWarningThreshold: false, verboseTrace: false, disableHeadings: false } as any);
    expect(run2.exitCode).toBe(0);
    const mapPath = path.join(out, 'version-map.json');
    const json = JSON.parse(await fs.readFile(mapPath, 'utf8'));
    expect(json.length).toBeGreaterThanOrEqual(2);
    const last = json[json.length - 1];
    const prev = json[json.length - 2];
    expect(last.previousVersionDir).toBe(prev.versionDir);
  });
});
