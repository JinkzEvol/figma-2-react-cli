import { describe, expect, it } from '@jest/globals';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { runPipeline } from '../../src/cli/run';

describe.skip('integration: perf harness', () => {
  it('reports total runtime and warns when simulated workload exceeds 5s', async () => {
    const outDir = path.resolve('generator/generated-perf-harness');
    const start = performance.now();
    const result = await runPipeline({
      file: 'PERF',
      node: '0:1',
      out: outDir,
      variants: false,
      reuseComponents: false,
      overrideWarningThreshold: false,
      verboseTrace: false,
      disableHeadings: false
    });
    const duration = performance.now() - start;

    if (result.summaryPath) {
      const summary = JSON.parse(await fs.readFile(result.summaryPath, 'utf8'));
      const total = summary?.timings?.total ?? Math.round(duration);
      // eslint-disable-next-line no-console
      console.log(`Perf harness: run completed in ${total}ms (wall ${Math.round(duration)}ms).`);
      if (total > 5000) {
        // eslint-disable-next-line no-console
        console.warn('Perf harness: typical frame exceeded 5s budget. Investigate regressions.');
      }
    }

    expect(result.exitCode === 0 || result.exitCode === 4).toBe(true);
  });
});
