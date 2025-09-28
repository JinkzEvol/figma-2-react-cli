import { describe, expect, it } from '@jest/globals';
import { runLiveFetchSession } from '../../src/connectivity/session';
import { loadJsonFixture } from './fixture-utils';

function createTransientError(status: number) {
  const error = new Error(`HTTP ${status}`);
  (error as any).status = status;
  (error as any).retryable = true;
  return error;
}

describe('connectivity: live fetch session', () => {
  it('retries with deterministic backoff schedule and tracks metrics', async () => {
    const delays: number[] = [];
    let now = 0;
    const clock = {
      now: () => now,
      async sleep(ms: number) {
        delays.push(ms);
        now += ms;
      }
    };

  const successPayload = await loadJsonFixture<any>('payloads', 'file-nodes-success.json');

  const responses = [
      () => {
        now += 120;
        throw createTransientError(429);
      },
      () => {
        now += 95;
        throw createTransientError(500);
      },
      () => {
        now += 110;
        throw createTransientError(504);
      },
      () => {
        now += 105;
        return successPayload;
      }
    ];

    const client = {
      async fetchFileNodes() {
        const next = responses.shift();
        if (!next) throw new Error('Unexpected extra call');
        return next();
      }
    };

    const result = await runLiveFetchSession({
      fileKey: 'FAKEFILE',
      nodeId: '0:1',
      client: client as any,
      clock,
      retryDelaysMs: [500, 1000, 2000, 4000],
      maxDurationMs: 120_000
    });

    expect(delays).toEqual([500, 1000, 2000]);
    expect(result.session.totalRequests).toBe(4);
    expect(result.session.retryCount).toBe(3);
    expect(result.session.retryBudgetMs).toBe(3500);
    expect(result.session.termination).toBe('success');
  });

  it('aborts when cumulative duration exceeds 120 seconds', async () => {
    let now = 0;
    const clock = {
      now: () => now,
      async sleep(ms: number) {
        now += ms;
      }
    };

    const client = {
      async fetchFileNodes() {
        now += 60_000;
        throw createTransientError(429);
      }
    };

    const result = await runLiveFetchSession({
      fileKey: 'FAKEFILE',
      nodeId: '0:1',
      client: client as any,
      clock,
      retryDelaysMs: [500, 1000, 2000, 4000],
      maxDurationMs: 120_000
    });

    expect(result.session.termination).toBe('timeout');
    expect(result.session.exitCode).not.toBe(0);
    expect(result.session.totalRequests).toBeGreaterThan(0);
  });
});
