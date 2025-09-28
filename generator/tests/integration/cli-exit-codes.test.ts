import { runPipeline } from '../../src/cli/run';

describe('CLI exit code mapping (T052)', () => {
  const baseOpts = {
    file: 'F', node: 'root', out: 'generated-exit', variants: false, reuseComponents: false,
    overrideWarningThreshold: false, verboseTrace: false, disableHeadings: false
  } as any;

  test('exit code 1 when token required but missing', async () => {
    delete process.env.FIGMA_TOKEN;
    const r = await runPipeline({ ...baseOpts, requireToken: true });
    expect(r.exitCode).toBe(1);
  });

  test('exit code 2 large document decline', async () => {
    process.env.LARGE_DOC_AUTO_DECLINE = '1';
    const largeRoot: any = { id: 'root', name: 'Root', type: 'FRAME', children: [] };
    // Simulate large by injecting many children
    for (let i = 0; i < 4000; i++) largeRoot.children.push({ id: 'c'+i, name: 'C'+i, type: 'RECTANGLE' });
    const r = await runPipeline({ ...baseOpts, nodeCountThreshold: 3000, depthThreshold: 12, rootNodeOverride: largeRoot });
    expect(r.exitCode).toBe(2);
  });

  test('exit code 3 fidelity failure simulated', async () => {
    const r = await runPipeline({ ...baseOpts, simulateFidelityFailure: true });
    expect(r.exitCode).toBe(3);
  });

  test('exit code 4 warning cap exceeded', async () => {
    const root: any = { id: 'root', name: 'Root', type: 'FRAME', children: [] };
    for (let i = 0; i < 10; i++) root.children.push({ id: 'n'+i, name: 'N'+i, type: 'RECTANGLE' });
    // Inflate effective layer count to 200 (cap = floor(200*0.05)=10). Inject 11 warnings to exceed.
    const r = await runPipeline({ ...baseOpts, testInjectWarnings: 11, rootNodeOverride: root, layerCountInflation: 189 });
    expect(r.exitCode).toBe(4);
  });

  test('exit code 0 when override flag bypasses warning cap', async () => {
    const r = await runPipeline({ ...baseOpts, testInjectWarnings: 50, overrideWarningThreshold: true });
    expect(r.exitCode).toBe(0);
  });

  test('exit code 5 simulated crash', async () => {
    const r = await runPipeline({ ...baseOpts, simulateCrash: true });
    expect(r.exitCode).toBe(5);
  });
});
