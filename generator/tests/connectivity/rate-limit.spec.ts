import { describe, expect, it } from '@jest/globals';
import { runLiveFetchSession } from '../../src/connectivity/session';

function create429Error() {
  const error = new Error('429 rate limited');
  (error as any).status = 429;
  (error as any).retryable = true;
  return error;
}

describe('connectivity: rate limit exhaustion', () => {
  it('aborts with exit code 6 after retries and no emitted components', async () => {
    let now = 0;
    const delays: number[] = [];
    const clock = {
      now: () => now,
      async sleep(ms: number) {
        delays.push(ms);
        now += ms;
      }
    };

    const client = {
      async fetchFileNodes() {
        now += 100;
        throw create429Error();
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

    expect(result.session.termination).toBe('rate-limit');
    expect(result.session.exitCode).toBe(6);
    expect(result.session.retryBudgetMs).toBe(7500);
    expect(delays).toEqual([500, 1000, 2000, 4000]);
    expect(result.segments).toHaveLength(0);
  });
});
