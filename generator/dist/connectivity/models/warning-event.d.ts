export type WarningCode = 'RETRY_USED' | 'LARGE_FILE_NEAR_LIMIT' | 'REPLAY_STALE' | 'API_AUTH_FAILURE' | 'API_RATE_LIMIT' | 'REPLAY_INTEGRITY' | 'REPLAY_VERSION_SKEW' | (string & {});
export interface WarningEvent {
    code: WarningCode;
    message: string;
    layerRef?: string | null;
    meta?: Record<string, unknown> | null;
    timestamp?: string;
}
