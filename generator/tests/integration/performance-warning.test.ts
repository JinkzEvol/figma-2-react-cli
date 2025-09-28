import { describe, expect, test } from '@jest/globals';
import { Timings } from '../../src/observability/timings';
import { Warnings } from '../../src/observability/warnings';
import { buildSummary } from '../../src/observability/summary';

describe('integration: performance warning', () => {
  test('simulated >5s total triggers exceededWarningCap unaffected but could add performance warning later', () => {
    const t = new Timings();
    t.start('total');
    // Simulate recorded durations by directly stopping with manipulated start
    (t as any).map.total.start = performance.now() - 6000; // 6s
    t.stop('total');
    // Fill other phases with dummy durations
    for (const p of ['fetch','preScan','transform','assets','emit','write'] as const) {
      (t as any).map[p].start = performance.now() - 100; t.stop(p);
    }
    const warnings = new Warnings();
    const summary = buildSummary({
      layerCount: 100,
      componentCount: 5,
      assetCount: 2,
      overrideUsed: false,
      largeDocument: false,
      versionDir: 'vTest',
      variants: [],
      variantConflicts: [],
      timings: t.record() as any,
      warnings,
      mode: 'static',
      usedNetwork: false
    });
    expect(summary.timings.total).toBeGreaterThanOrEqual(6000 - 50); // allow small jitter
  });
});
