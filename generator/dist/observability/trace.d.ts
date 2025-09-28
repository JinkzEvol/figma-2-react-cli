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
export declare class TraceBuilder {
    private entries;
    append(entry: TraceEntry): void;
    recordFetchSummary(session: FetchSessionState): void;
    all(): TraceEntry[];
}
