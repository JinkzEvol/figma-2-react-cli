import { describe, test, expect } from '@jest/globals';
import { runPipeline } from '../../src/cli/run';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * T017 Determinism ordering test (scaffold)
 * Run the pipeline twice on identical fixture; compare serialized outputs.
 */

describe('integration: determinism ordering', () => {
  test('two runs produce identical outputs', async () => {
    const out = path.resolve('generated-determinism');
    const r1 = await runPipeline({ file: 'F', node: 'root', out, variants: false, reuseComponents: false, overrideWarningThreshold: false, verboseTrace: true, disableHeadings: false } as any);
    const r2 = await runPipeline({ file: 'F', node: 'root', out, variants: false, reuseComponents: false, overrideWarningThreshold: false, verboseTrace: true, disableHeadings: false } as any);
    expect(r1.exitCode).toBe(0);
    expect(r2.exitCode).toBe(0);
    // List version directories
    const all = await fs.readdir(out);
    const dirs: string[] = [];
    for (const e of all) {
      if (!e.startsWith('v')) continue;
      const stat = await fs.lstat(path.join(out, e));
      if (stat.isDirectory()) dirs.push(e);
    }
    dirs.sort();
    expect(dirs.length).toBeGreaterThanOrEqual(2);
    const lastTwo = dirs.slice(-2);
    const [vPrev, vCurr] = lastTwo;
    // Compare component file content ignoring version directory path
    async function readComponent(vdir: string) {
      const files = await fs.readdir(path.join(out, vdir));
      const comp = files.find(f => f.endsWith('.tsx'))!;
      return fs.readFile(path.join(out, vdir, comp), 'utf8');
    }
    const prevComp = await readComponent(vPrev);
    const currComp = await readComponent(vCurr);
    expect(currComp).toBe(prevComp);
    // Compare summary stable subset
    async function readSummary(vdir: string) {
      const txt = await fs.readFile(path.join(out, vdir, 'summary.json'), 'utf8');
      return JSON.parse(txt);
    }
    const sPrev = await readSummary(vPrev);
    const sCurr = await readSummary(vCurr);
    expect(sCurr.layerCount).toBe(sPrev.layerCount);
    expect(sCurr.componentCount).toBe(sPrev.componentCount);
    expect(Array.isArray(sCurr.variants)).toBe(true);
  });
});
