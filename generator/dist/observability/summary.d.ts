import { Warnings } from './warnings';
import type { SummaryEnvelope, SummaryFetchMetrics, SummaryReplayMetadata } from '../connectivity/models/summary-envelope';
export interface TimingsRecord extends Record<string, number> {
    fetch: number;
    preScan: number;
    transform: number;
    assets: number;
    emit: number;
    write: number;
    total: number;
}
export interface BuildSummaryOptions {
    layerCount: number;
    componentCount: number;
    assetCount: number;
    overrideUsed: boolean;
    largeDocument: boolean;
    versionDir: string;
    variants?: string[];
    variantConflicts?: string[];
    timings: TimingsRecord;
    warnings: Warnings;
    mode: 'live' | 'replay' | 'static';
    usedNetwork: boolean;
    fetchMetrics?: Partial<SummaryFetchMetrics>;
    replay?: SummaryReplayMetadata | null;
}
export type ExportSummary = SummaryEnvelope & {
    layerCount: number;
    componentCount: number;
    assetCount: number;
    warningCount: number;
    warningCapLimit: number;
    exceededWarningCap: boolean;
    variants?: string[];
    variantConflicts?: string[];
    largeDocument: boolean;
    overrideUsed: boolean;
};
export declare function buildSummary(opts: BuildSummaryOptions): ExportSummary;
