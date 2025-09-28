import path from 'node:path';
import { promises as fs } from 'node:fs';
import generatorPkg from '../../package.json';
import { createFigmaClient } from '../figma/client';
import { preScan } from '../figma/prescan';
import { traverse } from '../transform/traverse';
import { emitComponent } from '../emit';
import { ensureVersionDir, updateVersionMap } from '../versioning';
import { TraceBuilder, Timings, Warnings, buildSummary } from '../observability';
import { confirmLargeDocument } from './confirmLargeDoc';
import {
  runLiveFetchSession,
  createMonotonicClock,
  writeReplayArtifact,
  loadReplayArtifact,
  extractDocument
} from '../connectivity';
import type { MonotonicClock } from '../connectivity';
import type { FetchSessionState } from '../connectivity/models/fetch-session';
import type { ModeSelection } from '../connectivity/models/mode-selection';
import type { SummaryReplayMetadata } from '../connectivity/models/summary-envelope';
import type { WarningEvent } from '../connectivity/models/warning-event';

const generatorVersion = generatorPkg.version;
const DEFAULT_REPLAY_BASE_DIR = path.resolve(process.cwd(), 'generator/generated-replay');

function createWarningEvent(
  code: WarningEvent['code'],
  message: string,
  meta?: Record<string, unknown>,
  layerRef?: string | null
): WarningEvent {
  return {
    code,
    message,
    meta: meta ?? null,
    layerRef: layerRef ?? null,
    timestamp: new Date().toISOString()
  };
}

function normalizeModeSelection(opts: RunOptions): ModeSelection {
  if (opts.modeSelection) return opts.modeSelection;
  return {
    live: !opts.replayPath,
    replayPath: opts.replayPath ? path.resolve(process.cwd(), opts.replayPath) : undefined,
    captureReplay: Boolean(opts.captureReplay),
    allowLargeFile: Boolean(opts.allowLargeFile),
    errors: []
  };
}

function createStaticFetchSession(fileKey: string, nodeId: string): FetchSessionState {
  return {
    fileKey,
    entryNodeId: nodeId,
    mode: 'static',
    usedNetwork: false,
    totalRequests: 0,
    retryCount: 0,
    fetchElapsedMs: 0,
    retryBudgetMs: 0,
    termination: 'success',
    exitCode: 0,
    warnings: [],
    timeouts: 0,
    rateLimitCount: 0,
    authorizationFailures: 0
  };
}

function createSyntheticRoot(nodeId: string): any {
  return { id: nodeId, name: 'RootFrame', type: 'FRAME', children: [] };
}

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
  connectivityClient?: { fetchFileNodes: (fileKey: string, nodeId: string) => Promise<any> };
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

export async function runPipeline(opts: RunOptions): Promise<RunResult> {
  const timings = new Timings();
  timings.start('total');
  const summaryWarnings = new Warnings();
  const trace = new TraceBuilder();
  const allWarningEvents: WarningEvent[] = [];

  const addWarning = (event: WarningEvent) => {
    allWarningEvents.push(event);
    summaryWarnings.addEvent(event);
  };

  if (opts.requireToken && !process.env.FIGMA_TOKEN) {
    timings.stop('total');
    return { exitCode: 1, warnings: allWarningEvents };
  }

  if (opts.simulateCrash) {
    timings.stop('total');
    return { exitCode: 5, warnings: allWarningEvents };
  }

  const modeSelection = normalizeModeSelection(opts);
  const replayNow = opts.replayNow ?? new Date();

  let rootNode: any = opts.rootNodeOverride;
  let fetchSession: FetchSessionState | undefined;
  let replayMetadata: SummaryReplayMetadata | undefined;

  timings.start('fetch');

  if (!rootNode) {
    if (modeSelection.replayPath) {
      try {
        const replayResult = await loadReplayArtifact({
          artifactPath: modeSelection.replayPath,
          expectedGeneratorVersion: generatorVersion,
          now: replayNow
        });
        replayResult.warnings.forEach(addWarning);
        if (replayResult.status !== 'success') {
          timings.stop('fetch');
          timings.stop('total');
          return { exitCode: 6, warnings: allWarningEvents };
        }
        fetchSession = {
          fileKey: opts.file,
          entryNodeId: opts.node,
          mode: 'replay',
          usedNetwork: false,
          totalRequests: 0,
          retryCount: 0,
          fetchElapsedMs: 0,
          retryBudgetMs: 0,
          termination: 'success',
          exitCode: 0,
          warnings: replayResult.warnings,
          timeouts: 0,
          rateLimitCount: 0,
          authorizationFailures: 0
        };
        replayMetadata = replayResult.replayMetadata;
        const firstSegment = replayResult.segments[0];
        if (firstSegment) {
          try {
            const payload = JSON.parse(firstSegment.response.body);
            rootNode = extractDocument(payload) ?? createSyntheticRoot(opts.node);
          } catch {
            rootNode = createSyntheticRoot(opts.node);
          }
        } else {
          rootNode = createSyntheticRoot(opts.node);
        }
      } catch (error) {
        addWarning(createWarningEvent('REPLAY_INTEGRITY', 'Failed to load replay artifact', {
          error: error instanceof Error ? error.message : String(error)
        }));
        timings.stop('fetch');
        timings.stop('total');
        return { exitCode: 6, warnings: allWarningEvents };
      }
    } else if (modeSelection.live && process.env.FIGMA_TOKEN) {
      const figmaClient = opts.connectivityClient ? undefined : createFigmaClient();
      const client = opts.connectivityClient ?? {
        fetchFileNodes: async (fileKey: string, nodeId: string) => {
          return figmaClient!.getFileNodes(fileKey, [nodeId]);
         }
       };

      const liveResult = await runLiveFetchSession({
        fileKey: opts.file,
        nodeId: opts.node,
        client,
        clock: opts.connectivityClock ?? createMonotonicClock(),
        retryDelaysMs: opts.retryDelaysMs,
        maxDurationMs: opts.maxFetchDurationMs
      });

      liveResult.warnings.forEach(addWarning);
      fetchSession = liveResult.session;

      if (fetchSession.exitCode !== 0) {
        timings.stop('fetch');
        timings.stop('total');
        return {
          exitCode: fetchSession.exitCode,
          warnings: allWarningEvents,
          fetchSession
        };
      }

      rootNode = liveResult.document ?? createSyntheticRoot(opts.node);

      if (modeSelection.captureReplay) {
        const replayResult = await writeReplayArtifact({
          baseDir: opts.replayBaseDir ?? DEFAULT_REPLAY_BASE_DIR,
          fileKey: opts.file,
          nodeId: opts.node,
          generatorVersion,
          session: fetchSession,
          segments: liveResult.segments
        });
        replayMetadata = replayResult.replayMetadata;
        fetchSession.replayArtifactPath = replayResult.replayMetadata.artifactPath;
        fetchSession.replayArtifact = replayResult.artifact;
      }
    } else {
      fetchSession = createStaticFetchSession(opts.file, opts.node);
      rootNode = createSyntheticRoot(opts.node);
    }
  }

  timings.stop('fetch');

  if (!fetchSession) {
    fetchSession = createStaticFetchSession(opts.file, opts.node);
  }
  if (!rootNode) {
    rootNode = createSyntheticRoot(opts.node);
  }

  if (fetchSession) {
    trace.recordFetchSummary(fetchSession);
  }

  timings.start('preScan');
  const scan = preScan(rootNode, {
    nodeCountThreshold: opts.nodeCountThreshold,
    depthThreshold: opts.depthThreshold
  });
  timings.stop('preScan');

  const thresholds = {
    nodeCount: opts.nodeCountThreshold ?? 3000,
    depth: opts.depthThreshold ?? 12
  };
  const largeDocument = scan.largeDocument;
  if (largeDocument) {
    addWarning(
      createWarningEvent(
        'LARGE_FILE_NEAR_LIMIT',
        `Node count ${scan.nodeCount} exceeded threshold ${thresholds.nodeCount}`,
        { nodeCount: scan.nodeCount, threshold: thresholds.nodeCount }
      )
    );
    if (!modeSelection.allowLargeFile) {
      const decision = confirmLargeDocument({
        nodeCount: scan.nodeCount,
        depth: scan.maxDepth,
        thresholds
      });
      if (!decision.accepted) {
        timings.stop('total');
        return {
          exitCode: 2,
          warnings: allWarningEvents,
          fetchSession,
          replay: replayMetadata
        };
      }
    }
  }

  timings.start('transform');
  const traverseResult = traverse(rootNode, { depthLimit: opts.depthThreshold });
  traverseResult.warnings.forEach((w) => {
    addWarning(createWarningEvent(w.code, w.message, undefined, w.layerRef ?? null));
  });
  traverseResult.allLayers.forEach((layer) => {
    trace.append({
      layerId: layer.id,
      layerName: layer.name,
      type: layer.type,
      ignored: layer.isIgnored,
      actions: [],
      depth: 0
    });
  });

  const componentName = 'GeneratedComponent';
  const classes = ['flex', 'flex-col'];
  const emission = emitComponent({ componentName, root: traverseResult.root, classList: classes });
  timings.stop('transform');

  timings.start('assets');
  timings.stop('assets');

  timings.start('emit');
  const ensure = await ensureVersionDir({ outParent: opts.out, baseComponent: componentName });
  const compFile = path.join(ensure.versionDir, `${componentName}.v1.tsx`);
  await fs.writeFile(compFile, emission, 'utf8');
  timings.stop('emit');

  timings.start('write');
  await updateVersionMap({ outParent: opts.out, baseComponent: componentName }, ensure, [compFile]);

  if (opts.testInjectWarnings && opts.testInjectWarnings > 0) {
    for (let i = 0; i < opts.testInjectWarnings; i++) {
      addWarning(createWarningEvent('TEST_WARNING', `Injected warning ${i + 1}`));
    }
  }

  const effectiveLayerCount = traverseResult.allLayers.length + (opts.layerCountInflation || 0);
  const fetchMetrics = fetchSession
    ? {
        totalRequests: fetchSession.totalRequests,
        retryCount: fetchSession.retryCount,
        fetchElapsedMs: fetchSession.fetchElapsedMs,
        retryBudgetMs: fetchSession.retryBudgetMs,
        timeouts: fetchSession.timeouts ?? 0,
        rateLimitCount: fetchSession.rateLimitCount ?? 0,
        authorizationFailures: fetchSession.authorizationFailures ?? 0,
        overrideNotice:
          (fetchSession.rateLimitCount ?? 0) > 0
            ? 'Rate limit encountered during fetch'
            : null
      }
    : undefined;
  const summary = buildSummary({
    layerCount: effectiveLayerCount,
    componentCount: 1,
    assetCount: 0,
    overrideUsed: opts.overrideWarningThreshold,
    largeDocument,
    versionDir: ensure.versionName,
    variants: [],
    variantConflicts: [],
    timings: timings.record() as any,
    warnings: summaryWarnings,
    mode: fetchSession?.mode ?? 'static',
    usedNetwork: fetchSession?.usedNetwork ?? false,
    fetchMetrics,
    replay: replayMetadata ?? null
  });

  const summaryPath = path.join(ensure.versionDir, 'summary.json');
  const tracePath = path.join(ensure.versionDir, 'trace.json');
  await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));
  if (opts.verboseTrace) {
    await fs.writeFile(tracePath, JSON.stringify(trace.all(), null, 2));
  }
  timings.stop('write');
  timings.stop('total');

  if (opts.simulateFidelityFailure) {
    return {
      exitCode: 3,
      summaryPath,
      tracePath: opts.verboseTrace ? tracePath : undefined,
      warnings: allWarningEvents,
      fetchSession,
      replay: replayMetadata
    };
  }

  if (summary.exceededWarningCap) {
    return {
      exitCode: 4,
      summaryPath,
      tracePath: opts.verboseTrace ? tracePath : undefined,
      warnings: allWarningEvents,
      fetchSession,
      replay: replayMetadata
    };
  }

  return {
    exitCode: 0,
    summaryPath,
    tracePath: opts.verboseTrace ? tracePath : undefined,
    warnings: allWarningEvents,
    fetchSession,
    replay: replayMetadata
  };
}
