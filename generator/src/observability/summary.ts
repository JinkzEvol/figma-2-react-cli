import { Warnings } from './warnings';
import type {
  SummaryEnvelope,
  SummaryFetchMetrics,
  SummaryReplayMetadata
} from '../connectivity/models/summary-envelope';

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

const WARNING_CAP_RATIO = 0.05;

function ensureFetchMetrics(metrics?: Partial<SummaryFetchMetrics>): SummaryFetchMetrics {
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

export function buildSummary(opts: BuildSummaryOptions): ExportSummary {
  const warningEvents = opts.warnings.list();
  const warningCount = warningEvents.length;
  const warningCapLimit = Math.floor(opts.layerCount * WARNING_CAP_RATIO);
  const exceededCap = warningCount > warningCapLimit && warningCapLimit > 0;
  const overrideNotice = exceededCap && opts.overrideUsed ? 'Warning threshold bypassed' : null;

  const fetch = ensureFetchMetrics(opts.fetchMetrics);
  if (!fetch.overrideNotice && overrideNotice) {
    fetch.overrideNotice = overrideNotice;
  }

  const summary: ExportSummary = {
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
