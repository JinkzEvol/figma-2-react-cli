import type { MonotonicClock } from '../connectivity';
import type { FetchSessionState } from '../connectivity/models/fetch-session';
import type { ModeSelection } from '../connectivity/models/mode-selection';
import type { SummaryReplayMetadata } from '../connectivity/models/summary-envelope';
import type { WarningEvent } from '../connectivity/models/warning-event';
export interface RunOptions {
    file: string;
    node: string;
    out: string;
    variants: boolean;
    reuseComponents: boolean;
    overrideWarningThreshold: boolean;
    verboseTrace: boolean;
    disableHeadings: boolean;
    nodeCountThreshold?: number;
    depthThreshold?: number;
    requireToken?: boolean;
    simulateFidelityFailure?: boolean;
    testInjectWarnings?: number;
    simulateCrash?: boolean;
    rootNodeOverride?: any;
    layerCountInflation?: number;
    captureReplay?: boolean;
    replayPath?: string;
    allowLargeFile?: boolean;
    modeSelection?: ModeSelection;
    retryDelaysMs?: number[];
    maxFetchDurationMs?: number;
    connectivityClock?: MonotonicClock;
    connectivityClient?: {
        fetchFileNodes: (fileKey: string, nodeId: string) => Promise<any>;
    };
    replayBaseDir?: string;
    replayNow?: Date;
}
export interface RunResult {
    exitCode: number;
    summaryPath?: string;
    tracePath?: string;
    warnings?: WarningEvent[];
    fetchSession?: FetchSessionState;
    replay?: SummaryReplayMetadata;
}
export declare function runPipeline(opts: RunOptions): Promise<RunResult>;
