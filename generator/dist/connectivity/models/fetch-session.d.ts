import type { ReplayArtifact } from './replay-artifact';
import type { WarningEvent } from './warning-event';
export type FetchTerminationReason = 'success' | 'timeout' | 'rate-limit' | 'auth' | 'integrity';
export interface FetchSessionState {
    fileKey: string;
    entryNodeId: string;
    mode: 'live' | 'replay' | 'static';
    usedNetwork: boolean;
    totalRequests: number;
    retryCount: number;
    fetchElapsedMs: number;
    retryBudgetMs: number;
    termination: FetchTerminationReason;
    exitCode: number;
    warnings: WarningEvent[];
    capturedAt?: string;
    replayArtifactPath?: string;
    replayArtifact?: ReplayArtifact;
    timeouts?: number;
    rateLimitCount?: number;
    authorizationFailures?: number;
}
