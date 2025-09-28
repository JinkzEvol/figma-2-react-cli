import { describe, expect, it, beforeEach, afterEach, jest } from '@jest/globals';
import { Warnings } from '../../src/observability/warnings';

const FIXED_DATE = new Date('2025-04-01T12:34:56.000Z');

describe('unit: warnings connectivity helpers', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(FIXED_DATE);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('records timestamps and meta data when adding simple warnings', () => {
    const warnings = new Warnings();
    warnings.add('RETRY_USED', 'Retry attempted', 'layer-123', { attempt: 2 });

    const list = warnings.list();
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({
      code: 'RETRY_USED',
      message: 'Retry attempted',
      layerRef: 'layer-123',
      meta: { attempt: 2 }
    });
    expect(list[0].timestamp).toBe(FIXED_DATE.toISOString());
  });

  it('preserves incoming timestamps when adding events', () => {
    const warnings = new Warnings();
    const existingTimestamp = new Date('2025-03-01T00:00:00.000Z').toISOString();

    warnings.addEvent({
      code: 'REPLAY_STALE',
      message: 'Replay artifact older than threshold',
      layerRef: null,
      meta: { ageDays: 15 },
      timestamp: existingTimestamp
    });

    const list = warnings.list();
    expect(list).toHaveLength(1);
    expect(list[0].timestamp).toBe(existingTimestamp);
    expect(list[0].meta).toEqual({ ageDays: 15 });
  });

  it('emits null placeholders when layerRef or meta are absent', () => {
    const warnings = new Warnings();
    warnings.add('API_RATE_LIMIT', 'Rate limit encountered');

    const list = warnings.list();
    expect(list[0].layerRef).toBeNull();
    expect(list[0].meta).toBeNull();
  });

  it('checks for codes without exposing mutable internals', () => {
    const warnings = new Warnings();
    warnings.add('API_AUTH_FAILURE', 'Auth failure');
    const snapshot = warnings.list();

    // mutate returned copy should not affect original collection
    snapshot[0].message = 'mutated';

    const listAgain = warnings.list();
    expect(warnings.has('API_AUTH_FAILURE')).toBe(true);
    expect(listAgain[0].message).toBe('Auth failure');
  });
});
