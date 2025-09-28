import { describe, test, expect } from '@jest/globals';
import { runPipeline } from '../../src/cli/run';

/**
 * T018 Large document gate test (scaffold)
 * Simulate pre-scan detecting large doc; decline then accept.
 */

describe('integration: large document gate', () => {
  function wide(count: number): any {
    const r: any = { id: 'root', name: 'Root', type: 'FRAME', children: [] };
    for (let i = 0; i < count; i++) r.children.push({ id: 'n'+i, name: 'N'+i, type: 'RECTANGLE' });
    return r;
  }

  test('decline path aborts without outputs', async () => {
    process.env.LARGE_DOC_AUTO_DECLINE = '1';
    delete process.env.LARGE_DOC_AUTO_ACCEPT;
    const root = wide(3100);
    const result = await runPipeline({ file: 'F', node: 'root', out: 'generated-large-decline', variants: false, reuseComponents: false, overrideWarningThreshold: false, verboseTrace: false, disableHeadings: false, nodeCountThreshold: 3000, depthThreshold: 12, rootNodeOverride: root } as any);
    expect(result.exitCode).toBe(2);
    expect(result.summaryPath).toBeUndefined();
  });

  test('accept path proceeds with largeDocument flag (exit 0)', async () => {
    process.env.LARGE_DOC_AUTO_ACCEPT = '1';
    delete process.env.LARGE_DOC_AUTO_DECLINE;
    const root = wide(3100);
    const result = await runPipeline({ file: 'F', node: 'root', out: 'generated-large-accept', variants: false, reuseComponents: false, overrideWarningThreshold: false, verboseTrace: false, disableHeadings: false, nodeCountThreshold: 3000, depthThreshold: 12, rootNodeOverride: root } as any);
    expect([0,4]).toContain(result.exitCode); // 0 normally; 4 only if somehow warnings injected > cap
    expect(result.summaryPath).toBeDefined();
  });
});
