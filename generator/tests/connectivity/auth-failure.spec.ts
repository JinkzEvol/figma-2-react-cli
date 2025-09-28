import { describe, expect, it } from '@jest/globals';
import { runLiveFetchSession } from '../../src/connectivity/session';

function createAuthError() {
  const error = new Error('401 unauthorized');
  (error as any).status = 401;
  (error as any).retryable = false;
  return error;
}

describe('connectivity: authorization failure', () => {
  it('aborts immediately with exit code 7 and warning', async () => {
    let now = 0;
    const clock = {
      now: () => now,
      async sleep(ms: number) {
        now += ms;
      }
    };

    const client = {
      async fetchFileNodes() {
        throw createAuthError();
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

    expect(result.session.termination).toBe('auth');
    expect(result.session.exitCode).toBe(7);
    expect(result.session.retryCount).toBe(0);
    expect(result.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'API_AUTH_FAILURE' })
      ])
    );
  });
});
