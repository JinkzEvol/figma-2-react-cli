"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSummary = buildSummary;
const WARNING_CAP_RATIO = 0.05;
function ensureFetchMetrics(metrics) {
    return {
        totalRequests: metrics?.totalRequests ?? 0,
        retryCount: metrics?.retryCount ?? 0,
        fetchElapsedMs: metrics?.fetchElapsedMs ?? 0,
        retryBudgetMs: metrics?.retryBudgetMs ?? 0,
        timeouts: metrics?.timeouts ?? 0,
        rateLimitCount: metrics?.rateLimitCount ?? 0,
        authorizationFailures: metrics?.authorizationFailures ?? 0,
        overrideNotice: metrics?.overrideNotice ?? null
    };
}
function buildSummary(opts) {
    const warningEvents = opts.warnings.list();
    const warningCount = warningEvents.length;
    const warningCapLimit = Math.floor(opts.layerCount * WARNING_CAP_RATIO);
    const exceededCap = warningCount > warningCapLimit && warningCapLimit > 0;
    const overrideNotice = exceededCap && opts.overrideUsed ? 'Warning threshold bypassed' : null;
    const fetch = ensureFetchMetrics(opts.fetchMetrics);
    if (!fetch.overrideNotice && overrideNotice) {
        fetch.overrideNotice = overrideNotice;
    }
    const summary = {
        versionDir: opts.versionDir,
        mode: opts.mode,
        usedNetwork: opts.usedNetwork,
        fetch,
        warnings: warningEvents,
        timings: opts.timings,
        replay: opts.replay ?? null,
        overrideNotice,
        warningCap: {
            threshold: WARNING_CAP_RATIO,
            override: opts.overrideUsed
        },
        layerCount: opts.layerCount,
        componentCount: opts.componentCount,
        assetCount: opts.assetCount,
        warningCount,
        warningCapLimit,
        exceededWarningCap: exceededCap && !opts.overrideUsed,
        variants: opts.variants || [],
        variantConflicts: opts.variantConflicts || [],
        largeDocument: opts.largeDocument,
        overrideUsed: opts.overrideUsed
    };
    return summary;
}
//# sourceMappingURL=summary.js.map