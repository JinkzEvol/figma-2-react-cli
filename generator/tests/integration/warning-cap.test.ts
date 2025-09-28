import { runPipeline } from '../../src/cli/run';
import { describe, test, expect } from '@jest/globals';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('integration: warning cap logic', () => {
  const base = {
    file: 'F', node: 'root', out: 'generated-warn-cap', variants: false, reuseComponents: false,
    verboseTrace: false, disableHeadings: false
  } as any;

  test('simulated run exceeding 5% warnings fails without override (exit 4)', async () => {
    // Build root with 10 children (11 layers total) + inflate to 200 for cap=10; inject 11 warnings
    const root: any = { id: 'root', name: 'Root', type: 'FRAME', children: [] };
    for (let i = 0; i < 10; i++) root.children.push({ id: 'c'+i, name: 'C'+i, type: 'RECTANGLE' });
    const r = await runPipeline({ ...base, testInjectWarnings: 11, rootNodeOverride: root, layerCountInflation: 189 });
    expect(r.exitCode).toBe(4);
  });

  test('override flag allows completion (exit 0) and sets overrideNotice', async () => {
    const root: any = { id: 'root2', name: 'Root2', type: 'FRAME', children: [] };
    for (let i = 0; i < 10; i++) root.children.push({ id: 'c2'+i, name: 'C2'+i, type: 'RECTANGLE' });
    const r = await runPipeline({ ...base, out: 'generated-warn-cap-override', testInjectWarnings: 11, rootNodeOverride: root, layerCountInflation: 189, overrideWarningThreshold: true });
    expect(r.exitCode).toBe(0);
    expect(r.summaryPath).toBeDefined();
    if (r.summaryPath) {
      const summary = JSON.parse(await fs.readFile(r.summaryPath, 'utf8'));
      expect(summary.overrideUsed).toBe(true);
      expect(summary.overrideNotice).toBeDefined();
      expect(summary.exceededWarningCap).toBe(false);
    }
  });
});
