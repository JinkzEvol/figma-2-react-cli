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
export declare function loadReplayArtifact(options: LoadReplayOptions): Promise<LoadReplayResult>;
