import { describe, test, expect } from '@jest/globals';
import { runPipeline } from '../../src/cli/run';

/**
 * T019 Depth limit test (scaffold)
 */

describe('integration: depth limit enforcement', () => {
  function deepChain(depth: number): any {
    let root: any = { id: 'd0', name: 'D0', type: 'FRAME', children: [] };
    let cursor = root;
    for (let i = 1; i < depth; i++) {
      const child = { id: 'd'+i, name: 'D'+i, type: 'FRAME', children: [] };
      cursor.children.push(child);
      cursor = child;
    }
    return root;
  }

  test('produces DEPTH_LIMIT_REACHED warning', async () => {
    const root = deepChain(40); // exceed default 25
    const result = await runPipeline({
      file: 'F', node: 'd0', out: 'generated-depth-limit', variants: false, reuseComponents: false,
      overrideWarningThreshold: false, verboseTrace: false, disableHeadings: false,
      rootNodeOverride: root, depthThreshold: 25,
      allowLargeFile: true,
      layerCountInflation: 1000
    } as any);
    expect(result.exitCode).toBe(0); // still success
    expect(result.warnings?.some(w => w.code === 'DEPTH_LIMIT_REACHED')).toBe(true);
  });
});
