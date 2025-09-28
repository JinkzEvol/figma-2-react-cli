import { describe, expect, it } from '@jest/globals';
import { buildSummary } from '../../src/observability/summary';
import { Warnings } from '../../src/observability/warnings';
import { resolveColor } from '../../src/transform/colors';

describe('integration: color fallback logging', () => {
  it('records color fallback usage in warnings and summary output', () => {
    const warnings = new Warnings();
    const fallbackHits: string[] = [];
    const palette = { brand: '#ff00aa' };

    const arbitrary = resolveColor('#123456', {
      palette,
      onFallback: (input) => {
        fallbackHits.push(input);
        warnings.add('COLOR_FALLBACK', `Fell back to arbitrary color ${input}`);
      }
    });

    expect(arbitrary).toBe('text-[#123456]');
    expect(fallbackHits).toEqual(['#123456']);

    const summary = buildSummary({
      layerCount: 10,
      componentCount: 1,
      assetCount: 0,
      overrideUsed: false,
      largeDocument: false,
      versionDir: 'vTest',
      variants: [],
      variantConflicts: [],
      timings: { fetch: 0, preScan: 0, transform: 0, assets: 0, emit: 0, write: 0, total: 0 },
      warnings,
      mode: 'static',
      usedNetwork: false
    });

    expect(summary.warnings.map((w: any) => w.code)).toContain('COLOR_FALLBACK');
    expect(summary.warnings.find((w: any) => w.code === 'COLOR_FALLBACK')?.message).toContain('#123456');
  });
});
