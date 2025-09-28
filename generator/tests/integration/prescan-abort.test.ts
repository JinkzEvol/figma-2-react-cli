import { runPipeline } from '../../src/cli/run';
import { describe, test, expect, beforeAll } from '@jest/globals';
import * as fs from 'fs/promises';
import * as path from 'path';

function buildWideTree(count: number): any {
  const root: any = { id: 'root', name: 'Root', type: 'FRAME', children: [] };
  for (let i = 0; i < count; i++) root.children.push({ id: `n-${i}`, name: `N-${i}`, type: 'RECTANGLE' });
  return root;
}

describe('large document abort (T061)', () => {
  const outDir = path.resolve(__dirname, '..', '..', 'tmp-large-abort');
  beforeAll(async () => { await fs.mkdir(outDir, { recursive: true }); });
  test('declines large doc and returns exit code 2', async () => {
    process.env.LARGE_DOC_AUTO_DECLINE = '1';
    const root = buildWideTree(3100); // nodeCount 3101 (>3000) minimal depth
    try {
      const result = await runPipeline({
        file: 'F', node: 'root', out: outDir, variants: false, reuseComponents: false,
        overrideWarningThreshold: false, verboseTrace: false, disableHeadings: false,
        nodeCountThreshold: 3000, depthThreshold: 12,
        rootNodeOverride: root
      } as any);
      expect(result.exitCode).toBe(2);
    } finally {
      delete process.env.LARGE_DOC_AUTO_DECLINE;
    }
  });
});
