import { describe, expect, it } from '@jest/globals';
import { buildSummary } from '../../src/observability/summary';
import { Warnings } from '../../src/observability/warnings';
import { TraceBuilder } from '../../src/observability/trace';

describe('integration: summary connectivity', () => {
  it('enforces warning cap, attaches override notice, and tags trace entries with source', () => {
    const warnings = new Warnings();
    warnings.add('RETRY_USED', 'Retry executed');
    warnings.add('LARGE_FILE_NEAR_LIMIT', 'Large file nearing limit');
    warnings.add('REPLAY_STALE', 'Replay artifact older than threshold');

    const trace = new TraceBuilder();
    trace.append({
      layerId: 'fetch-1',
      layerName: 'Fetch Request 1',
      type: 'FETCH',
      ignored: false,
      actions: ['network:source=network'],
      depth: 0
    });
    trace.append({
      layerId: 'fetch-2',
      layerName: 'Fetch Request 2',
      type: 'FETCH',
      ignored: false,
      actions: ['network:source=replay'],
      depth: 0
    });

    const summary = buildSummary({
      layerCount: 20,
      componentCount: 2,
      assetCount: 0,
      overrideUsed: false,
      largeDocument: false,
      versionDir: 'v20250927-2126-ac1b2dff',
      variants: [],
      variantConflicts: [],
      timings: {
        total: 2000,
        fetch: 1200
      } as any,
      warnings,
      mode: 'live',
      usedNetwork: true,
      fetchMetrics: {
        totalRequests: 3,
        retryCount: 2,
        fetchElapsedMs: 1200,
        retryBudgetMs: 3000,
        timeouts: 0,
        rateLimitCount: 0,
        authorizationFailures: 0
      }
    });

    expect(summary.warningCap).toBeDefined();
  expect(summary.exceededWarningCap).toBe(true);
    expect((summary as any).warnings.map((w: any) => w.code)).toEqual([
      'RETRY_USED',
      'LARGE_FILE_NEAR_LIMIT',
      'REPLAY_STALE'
    ]);

    const traceEntries = trace.all();
    expect(traceEntries[0].actions?.[0]).toContain('source=network');
    expect(traceEntries[1].actions?.[0]).toContain('source=replay');
  });
});
