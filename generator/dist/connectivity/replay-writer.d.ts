import type { FetchSessionState } from './models/fetch-session';
import type { ReplayArtifact } from './models/replay-artifact';
import type { SummaryReplayMetadata } from './models/summary-envelope';
import type { CapturedSegment } from './session';
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
export declare function writeReplayArtifact(options: WriteReplayArtifactOptions): Promise<WriteReplayArtifactResult>;
