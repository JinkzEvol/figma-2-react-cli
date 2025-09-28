import type { WarningEvent } from './warning-event';
export interface SummaryFetchMetrics {
    totalRequests: number;
    retryCount: number;
    fetchElapsedMs: number;
    retryBudgetMs: number;
    timeouts: number;
    rateLimitCount: number;
    authorizationFailures: number;
    overrideNotice?: string | null;
}
export interface SummaryReplayMetadata {
    artifactPath: string;
    manifestHash: string;
    createdAt: string;
    ageDays: number;
}
export interface WarningCapStatus {
    threshold: number;
    override: boolean;
}
export interface SummaryEnvelope {
    versionDir: string;
    mode: 'live' | 'replay' | 'static';
    usedNetwork: boolean;
    fetch: SummaryFetchMetrics;
    warnings: WarningEvent[];
    timings: Record<string, number> & {
        fetch?: number;
    };
    replay?: SummaryReplayMetadata | null;
    overrideNotice?: string | null;
    warningCap?: WarningCapStatus;
}
