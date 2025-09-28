"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TraceBuilder = void 0;
class TraceBuilder {
    entries = [];
    append(entry) {
        // Ensure required arrays exist
        if (!entry.actions)
            entry.actions = [];
        this.entries.push(entry);
    }
    recordFetchSummary(session) {
        const source = session.mode === 'replay' ? 'replay' : session.usedNetwork ? 'network' : 'static';
        const actions = [
            `source=${source}`,
            `totalRequests=${session.totalRequests}`,
            `retries=${session.retryCount}`
        ];
        if (session.retryBudgetMs)
            actions.push(`retryBudgetMs=${session.retryBudgetMs}`);
        if (session.fetchElapsedMs)
            actions.push(`elapsedMs=${Math.round(session.fetchElapsedMs)}`);
        this.append({
            layerId: `fetch-${session.mode}`,
            layerName: 'Fetch Session',
            type: 'FETCH',
            ignored: false,
            actions,
            warnings: session.warnings.map((w) => w.code),
            depth: 0,
            source
        });
    }
    all() {
        return this.entries.slice(); // shallow copy
    }
}
exports.TraceBuilder = TraceBuilder;
//# sourceMappingURL=trace.js.map