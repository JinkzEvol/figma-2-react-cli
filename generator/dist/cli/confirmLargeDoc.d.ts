/**
 * Large document confirmation hook (T058)
 * Strategy: Non-interactive environment variable gating.
 * If LARGE_DOC_AUTO_ACCEPT=1 → accept.
 * If LARGE_DOC_AUTO_DECLINE=1 → decline.
 * Otherwise, default decline (tests can override by setting env).
 */
export interface LargeDocDecision {
    accepted: boolean;
    reason?: string;
}
export declare function confirmLargeDocument(context: {
    nodeCount: number;
    depth: number;
    thresholds: {
        nodeCount: number;
        depth: number;
    };
}): LargeDocDecision;
