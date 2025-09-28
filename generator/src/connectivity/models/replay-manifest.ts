import type { ReplaySegment } from './replay-segment';

export interface ReplayManifest {
  schemaVersion: string;
  fileKey: string;
  nodeId: string;
  createdAt: string;
  generatorVersion: string;
  hash: string;
  segments: ReplaySegment[];
  notes?: string | null;
  replayAgeDays?: number;
}
