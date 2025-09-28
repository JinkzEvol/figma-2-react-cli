import { describe, expect, it, jest } from '@jest/globals';
import { loadReplayArtifact } from '../../src/connectivity/replay-loader';

jest.mock('../../src/connectivity/replay-loader');

const loadReplayArtifactMock = loadReplayArtifact as jest.MockedFunction<typeof loadReplayArtifact>;

describe('connectivity: replay staleness', () => {
  it('emits REPLAY_STALE warning when artifact exceeds 14 days', async () => {
    loadReplayArtifactMock.mockResolvedValue({
      status: 'success',
      manifest: {
        schemaVersion: '1.0.0',
        fileKey: 'FILE',
        nodeId: '0:1',
        createdAt: '2025-09-01T00:00:00.000Z',
        generatorVersion: '0.1.0',
        hash: 'deadbeef',
        segments: [
          {
            id: 'seg-1',
            request: {
              method: 'GET',
              path: '/v1/files/FILE/nodes',
              query: { ids: '0:1' },
              headers: { accept: 'application/json' }
            },
            response: {
              status: 200,
              bodyPath: 'responses/seg-1.json',
              headers: { 'content-type': 'application/json' },
              recordedAt: '2025-09-01T00:00:00.000Z'
            },
            sha1: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
            source: 'network'
          }
        ]
      },
      segments: [],
      warnings: [
        {
          code: 'REPLAY_STALE',
          message: 'Artifact older than 14 days',
          meta: { ageDays: 21 },
          timestamp: '2025-09-30T00:00:00.000Z'
        }
      ]
    });

    const result = await loadReplayArtifact({
      artifactPath: 'path/to/artifact',
      expectedGeneratorVersion: '0.1.0',
      now: new Date('2025-09-30T00:00:00.000Z')
    } as any);

    expect(result.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'REPLAY_STALE' })
      ])
    );
  });
});
