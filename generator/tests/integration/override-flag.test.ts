
/**
 * T016 Integration test override flag audit (scaffold)
 * EXPECTED INITIAL STATE: Fails until pipeline implemented.
 * Goal: Running pipeline with --ignore-warning-threshold sets summary.overrideUsed=true and summary.overrideNotice present.
 */

import { runPipeline } from '../../src/cli/run';
import { describe, test, expect } from '@jest/globals';
import * as fs from 'fs/promises';

describe('integration: override flag audit', () => {
  test('sets overrideUsed and overrideNotice in summary', async () => {
    const root: any = { id: 'root-o', name: 'RootO', type: 'FRAME', children: [] };
    for (let i = 0; i < 10; i++) root.children.push({ id: 'ov'+i, name: 'Ov'+i, type: 'RECTANGLE' });
    const result = await runPipeline({
      file: 'F', node: 'root-o', out: 'generated-override-flag', variants: false, reuseComponents: false,
      overrideWarningThreshold: true, verboseTrace: false, disableHeadings: false,
      testInjectWarnings: 11, rootNodeOverride: root, layerCountInflation: 189
    } as any);
    expect(result.exitCode).toBe(0);
    expect(result.summaryPath).toBeDefined();
    if (result.summaryPath) {
      const summary = JSON.parse(await fs.readFile(result.summaryPath, 'utf8'));
      expect(summary.overrideUsed).toBe(true);
      expect(summary.overrideNotice).toBeDefined();
      expect(summary.exceededWarningCap).toBe(false);
    }
  });
});
