import type { FetchSessionState } from '../connectivity/models/fetch-session';

export interface TraceEntry {
  layerId: string;
  layerName: string;
  type: string;
  ignored?: boolean;
  actions: string[];
  warnings?: string[];
  depth?: number;
  source?: 'network' | 'replay' | 'static';
}

export class TraceBuilder {
  private entries: TraceEntry[] = [];
  append(entry: TraceEntry) {
    // Ensure required arrays exist
    if (!entry.actions) entry.actions = [];
    this.entries.push(entry);
  }
  recordFetchSummary(session: FetchSessionState) {
    const source: TraceEntry['source'] = session.mode === 'replay' ? 'replay' : session.usedNetwork ? 'network' : 'static';
    const actions = [
      `source=${source}`,
      `totalRequests=${session.totalRequests}`,
      `retries=${session.retryCount}`
    ];
    if (session.retryBudgetMs) actions.push(`retryBudgetMs=${session.retryBudgetMs}`);
    if (session.fetchElapsedMs) actions.push(`elapsedMs=${Math.round(session.fetchElapsedMs)}`);
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
  all(): TraceEntry[] {
    return this.entries.slice(); // shallow copy
  }
}
