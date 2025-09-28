import { promises as fs } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { canonicalize } from '../hashing/canonical';
import type { ReplayManifest } from './models/replay-manifest';
import type { WarningEvent } from './models/warning-event';
import type { SummaryReplayMetadata } from './models/summary-envelope';
import type { CapturedSegment } from './session';

export interface LoadReplayOptions {
  artifactPath: string;
  expectedGeneratorVersion: string;
  now: Date;
}

export interface LoadReplayResult {
  status: 'success' | 'integrity-error';
  warnings: WarningEvent[];
  manifest?: ReplayManifest;
  segments: CapturedSegment[];
  replayMetadata?: SummaryReplayMetadata;
}

function createWarning(code: WarningEvent['code'], message: string, meta?: Record<string, unknown>): WarningEvent {
  return {
    code,
    message,
    meta: meta ?? null,
    layerRef: null,
    timestamp: new Date().toISOString()
  };
}

function daysBetween(now: Date, then: Date): number {
  const diffMs = now.getTime() - then.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

function parseManifest(content: string): ReplayManifest {
  const parsed = JSON.parse(content);
  return parsed as ReplayManifest;
}

function computeSha1(buffer: Buffer): string {
  return crypto.createHash('sha1').update(buffer).digest('hex');
}

export async function loadReplayArtifact(options: LoadReplayOptions): Promise<LoadReplayResult> {
  const warnings: WarningEvent[] = [];
  const artifactDir = path.resolve(options.artifactPath);
  const manifestPath = path.join(artifactDir, 'manifest.json');
  const manifestRaw = await fs.readFile(manifestPath, 'utf8');
  const manifest = parseManifest(manifestRaw);

  const createdAt = new Date(manifest.createdAt);
  const ageDays = daysBetween(options.now, createdAt);
  const segments: CapturedSegment[] = [];
  let integrityOk = true;

  const manifestHashSource = canonicalize({
    schemaVersion: manifest.schemaVersion,
    fileKey: manifest.fileKey,
    nodeId: manifest.nodeId,
    createdAt: manifest.createdAt,
    generatorVersion: manifest.generatorVersion,
    segments: manifest.segments
  });
  const computedManifestHash = crypto.createHash('sha1').update(manifestHashSource).digest('hex').slice(0, 8);
  const rawManifestHashSource = JSON.stringify({
    schemaVersion: manifest.schemaVersion,
    fileKey: manifest.fileKey,
    nodeId: manifest.nodeId,
    createdAt: manifest.createdAt,
    generatorVersion: manifest.generatorVersion,
    segments: manifest.segments
  });
  const alternateManifestHash = crypto
    .createHash('sha1')
    .update(rawManifestHashSource)
    .digest('hex')
    .slice(0, 8);
  const manifestHashValid =
    manifest.hash === computedManifestHash || manifest.hash === alternateManifestHash;
  if (!manifestHashValid) {
    integrityOk = false;
    warnings.push(
      createWarning('REPLAY_INTEGRITY', 'Replay manifest hash mismatch', {
        expected: manifest.hash,
        actual: computedManifestHash
      })
    );
  }

  for (const segment of manifest.segments) {
    const segmentPath = path.join(artifactDir, segment.response.bodyPath);
    const bodyBuffer = await fs.readFile(segmentPath);
    const sha1 = computeSha1(bodyBuffer);
    if (sha1 !== segment.sha1) {
      integrityOk = false;
      warnings.push(createWarning('REPLAY_INTEGRITY', 'Replay payload hash mismatch', { expected: segment.sha1, actual: sha1, segment: segment.id }));
    }
    segments.push({
      id: segment.id,
      request: segment.request,
      response: {
        status: segment.response.status,
        headers: segment.response.headers,
        body: bodyBuffer.toString('utf8'),
        recordedAt: segment.response.recordedAt
      },
      source: 'replay'
    });
  }

  const expectedMajor = parseInt(options.expectedGeneratorVersion.split('.')[0] ?? '0', 10);
  const manifestMajor = parseInt(manifest.generatorVersion.split('.')[0] ?? '0', 10);
  if (!Number.isNaN(expectedMajor) && !Number.isNaN(manifestMajor) && expectedMajor !== manifestMajor) {
    warnings.push(createWarning('REPLAY_VERSION_SKEW', 'Replay artifact was captured with a different major generator version', {
      expected: options.expectedGeneratorVersion,
      found: manifest.generatorVersion
    }));
  }

  if (ageDays > 14) {
    warnings.push(createWarning('REPLAY_STALE', 'Replay artifact is older than 14 days', { ageDays }));
  }

  manifest.replayAgeDays = ageDays;

  const replayMetadata: SummaryReplayMetadata = {
    artifactPath: artifactDir,
    manifestHash: manifest.hash,
    createdAt: manifest.createdAt,
    ageDays
  };

  return {
    status: integrityOk ? 'success' : 'integrity-error',
    warnings,
    manifest,
    segments,
    replayMetadata
  };
}
