import type { FetchSessionState } from './models/fetch-session';
import type { ReplayRequestEnvelope, ReplaySource } from './models/replay-segment';
import type { WarningEvent } from './models/warning-event';
export interface MonotonicClock {
    now(): number;
    sleep(ms: number): Promise<void>;
}
export interface LiveFetchSessionOptions {
    fileKey: string;
    nodeId: string;
    client: {
        fetchFileNodes: (fileKey: string, nodeId: string) => Promise<any>;
    };
    clock?: MonotonicClock;
    retryDelaysMs?: number[];
    maxDurationMs?: number;
}
export interface CapturedSegment {
    id: string;
    request: ReplayRequestEnvelope;
    response: {
        status: number;
        headers: Record<string, string>;
        body: string;
        recordedAt: string;
    };
    source: ReplaySource;
}
export interface LiveFetchSessionResult {
    session: FetchSessionState;
    document?: any;
    warnings: WarningEvent[];
    segments: CapturedSegment[];
}
export declare function createMonotonicClock(): MonotonicClock;
export declare function extractDocument(payload: any): any;
export declare function runLiveFetchSession(options: LiveFetchSessionOptions): Promise<LiveFetchSessionResult>;
