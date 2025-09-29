import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { loadReplayArtifact } from '../../src/connectivity/replay-loader';
import { fixturePath } from './fixture-utils';

interface ReplayArtifactFixture {
  dir: string;
  manifestPath: string;
  manifest: any;
}

async function createReplayArtifactFixture(overrides: Partial<{ hash: string; generatorVersion: string; responseBody: string }> = {}): Promise<ReplayArtifactFixture> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'replay-fixture-'));
  createdDirs.push(dir);
  const responsesDir = path.join(dir, 'responses');
  await fs.mkdir(responsesDir, { recursive: true });

  const body = overrides.responseBody ?? JSON.stringify({ document: { id: '0:1' } });
  const bodyHash = crypto.createHash('sha1').update(body).digest('hex');
  const bodyFilename = 'segment-0.json';
  await fs.writeFile(path.join(responsesDir, bodyFilename), body, 'utf8');

  const segment = {
    id: 'GET-file-nodes',
    request: {
      method: 'GET',
      path: '/v1/files/ABCD1234/nodes',
      query: { ids: '0:1' },
      headers: { accept: 'application/json' }
    },
    response: {
      status: 200,
      bodyPath: `responses/${bodyFilename}`,
      headers: { 'content-type': 'application/json' },
      recordedAt: '2025-09-27T21:26:00.000Z'
    },
    sha1: bodyHash,
    source: 'network'
  };

  const baseManifest = {
    schemaVersion: '1.0.0',
    fileKey: 'ABCD1234',
    nodeId: '0:1',
    createdAt: '2025-09-27T21:26:00.000Z',
    generatorVersion: overrides.generatorVersion ?? '0.1.0',
    segments: [segment],
    notes: null
  };

  const hashSource = JSON.stringify({
    schemaVersion: baseManifest.schemaVersion,
    fileKey: baseManifest.fileKey,
    nodeId: baseManifest.nodeId,
    createdAt: baseManifest.createdAt,
    generatorVersion: baseManifest.generatorVersion,
    segments: baseManifest.segments
  });
  const manifestHash = overrides.hash ?? crypto.createHash('sha1').update(hashSource).digest('hex').slice(0, 8);

  const manifest = { ...baseManifest, hash: manifestHash };
  const manifestPath = path.join(dir, 'manifest.json');
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

  return { dir, manifestPath, manifest };
}

const createdDirs: string[] = [];

beforeEach(() => {
  createdDirs.length = 0;
});

afterEach(async () => {
  await Promise.all(
    createdDirs.map(async (dir) => {
      await fs.rm(dir, { recursive: true, force: true });
    })
  );
});

describe('connectivity: replay integrity', () => {
  it('loads a valid replay artifact without warnings', async () => {
    const artifactDir = fixturePath('quickstart', 'replay-run');
    const result = await loadReplayArtifact({
      artifactPath: artifactDir,
      expectedGeneratorVersion: '0.1.0',
      now: new Date('2025-09-30T00:00:00.000Z')
    });

    expect(result.status).toBe('success');
    expect(result.warnings).toHaveLength(0);
  expect(result.manifest as any).toMatchObject({ hash: 'c450ace1', generatorVersion: '0.1.0' });
    expect(result.segments).toHaveLength(1);
  });

  it('emits REPLAY_INTEGRITY warning when hash mismatches payload', async () => {
    const fixture = await createReplayArtifactFixture({ hash: 'deadbeef' });
    const result = await loadReplayArtifact({
      artifactPath: fixture.dir,
      expectedGeneratorVersion: '0.1.0',
      now: new Date('2025-09-30T00:00:00.000Z')
    });

    expect(result.status).toBe('integrity-error');
    expect(result.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'REPLAY_INTEGRITY' })
      ])
    );
  });

  it('warns when replay generator major version differs', async () => {
    const fixture = await createReplayArtifactFixture({ generatorVersion: '1.2.3' });
    const result = await loadReplayArtifact({
      artifactPath: fixture.dir,
      expectedGeneratorVersion: '0.9.9',
      now: new Date('2025-09-30T00:00:00.000Z')
    });

    expect(result.status).toBe('success');
    expect(result.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'REPLAY_VERSION_SKEW' })
      ])
    );
  });
});
