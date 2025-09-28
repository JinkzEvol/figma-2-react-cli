import type { ReplayManifest } from './replay-manifest';

export interface ReplayArtifact {
  manifest: ReplayManifest;
  responsesDir: string;
  hash: string;
  createdAt: string;
  generatorVersion: string;
  source: 'network';
}
