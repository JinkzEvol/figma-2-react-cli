import { promises as fs } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import type { FetchSessionState } from './models/fetch-session';
import type { ReplayArtifact } from './models/replay-artifact';
import type { ReplayManifest } from './models/replay-manifest';
import type { ReplaySegment } from './models/replay-segment';
import type { SummaryReplayMetadata } from './models/summary-envelope';
import type { CapturedSegment } from './session';
import { canonicalize } from '../hashing/canonical';

export interface WriteReplayArtifactOptions {
  baseDir: string;
  fileKey: string;
  nodeId: string;
  generatorVersion: string;
  session: FetchSessionState;
  segments: CapturedSegment[];
  schemaVersion?: string;
}

export interface WriteReplayArtifactResult {
  artifact: ReplayArtifact;
  manifestPath: string;
  replayMetadata: SummaryReplayMetadata;
}

function ensureIsoTimestamp(timestamp?: string): string {
  if (timestamp) return timestamp;
  return new Date().toISOString();
}

function safeSegmentName(id: string): string {
  return id.replace(/[^a-zA-Z0-9_-]+/g, '-');
}

function formatDirName(createdAt: string, hash: string): string {
  const compact = createdAt.replace(/[-:]/g, '').replace('T', '').replace('Z', '').slice(0, 12);
  const datePart = `${compact.slice(0, 8)}-${compact.slice(8, 12)}`;
  return `v${datePart}-${hash}`;
}

async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

export async function writeReplayArtifact(options: WriteReplayArtifactOptions): Promise<WriteReplayArtifactResult> {
  if (!options.segments || options.segments.length === 0) {
    throw new Error('Cannot persist replay artifact without captured segments');
  }

  const schemaVersion = options.schemaVersion ?? '1.0.0';
  const createdAt = ensureIsoTimestamp(options.session.capturedAt);
  const baseDir = path.resolve(options.baseDir);

  const preparedSegments = options.segments.map((segment, index) => {
    const bodyBuffer = Buffer.from(segment.response.body, 'utf8');
    const sha1 = crypto.createHash('sha1').update(bodyBuffer).digest('hex');
    const filename = `${index.toString().padStart(3, '0')}-${safeSegmentName(segment.id)}-${sha1.slice(0, 8)}.json`;
    const bodyPath = path.posix.join('responses', filename);

    const manifestSegment: ReplaySegment = {
      id: segment.id,
      request: segment.request,
      response: {
        status: segment.response.status,
        bodyPath,
        headers: segment.response.headers,
        recordedAt: segment.response.recordedAt
      },
      sha1,
      source: segment.source
    };

    return { manifestSegment, filename, bodyBuffer };
  });

  const manifestPayload: ReplayManifest = {
    schemaVersion,
    fileKey: options.fileKey,
    nodeId: options.nodeId,
    createdAt,
    generatorVersion: options.generatorVersion,
    hash: '',
    segments: preparedSegments.map((entry) => entry.manifestSegment),
    notes: null
  };

  const hashSource = canonicalize({
    schemaVersion: manifestPayload.schemaVersion,
    fileKey: manifestPayload.fileKey,
    nodeId: manifestPayload.nodeId,
    createdAt: manifestPayload.createdAt,
    generatorVersion: manifestPayload.generatorVersion,
    segments: manifestPayload.segments
  });
  const manifestHash = crypto.createHash('sha1').update(hashSource).digest('hex').slice(0, 8);
  manifestPayload.hash = manifestHash;

  const artifactDirName = formatDirName(createdAt, manifestHash);
  const artifactDir = path.join(baseDir, artifactDirName);
  const responsesDir = path.join(artifactDir, 'responses');
  await ensureDir(responsesDir);

  for (const entry of preparedSegments) {
    await fs.writeFile(path.join(responsesDir, entry.filename), entry.bodyBuffer, 'utf8');
  }

  const manifestPath = path.join(artifactDir, 'manifest.json');
  await fs.writeFile(manifestPath, JSON.stringify(manifestPayload, null, 2));

  const artifact: ReplayArtifact = {
    manifest: manifestPayload,
    responsesDir,
    hash: manifestHash,
    createdAt,
    generatorVersion: options.generatorVersion,
    source: 'network'
  };

  const replayMetadata: SummaryReplayMetadata = {
    artifactPath: artifactDir,
    manifestHash,
    createdAt,
    ageDays: 0
  };

  return {
    artifact,
    manifestPath,
    replayMetadata
  };
}
