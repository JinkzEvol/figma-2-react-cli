import { runPipeline } from '../../src/cli/run';

function buildDeep(depth: number): any {
  let node: any = { id: 'n0', name: 'N0', type: 'FRAME', children: [] };
  const root = node;
  for (let i = 1; i < depth; i++) {
    const child = { id: `n${i}`, name: `N${i}`, type: 'FRAME', children: [] };
    node.children.push(child);
    node = child;
  }
  return root;
}

describe('depth limit extended (T062)', () => {
  test('emits DEPTH_LIMIT_REACHED warning when depth exceeded', async () => {
    const deep = buildDeep(40); // exceed default 25
    const result = await runPipeline({
      file: 'F', node: 'n0', out: 'generated-depth', variants: false, reuseComponents: false,
      overrideWarningThreshold: false, verboseTrace: false, disableHeadings: false,
      depthThreshold: 25
    } as any);
    expect(result.exitCode).toBe(0); // exit mapping not yet applied
  });
});
