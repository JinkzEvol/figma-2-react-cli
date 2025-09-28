"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runPipeline = runPipeline;
const node_path_1 = __importDefault(require("node:path"));
const node_fs_1 = require("node:fs");
const package_json_1 = __importDefault(require("../../package.json"));
const client_1 = require("../figma/client");
const prescan_1 = require("../figma/prescan");
const traverse_1 = require("../transform/traverse");
const emit_1 = require("../emit");
const versioning_1 = require("../versioning");
const observability_1 = require("../observability");
const confirmLargeDoc_1 = require("./confirmLargeDoc");
const connectivity_1 = require("../connectivity");
const generatorVersion = package_json_1.default.version;
const DEFAULT_REPLAY_BASE_DIR = node_path_1.default.resolve(process.cwd(), 'generator/generated-replay');
function createWarningEvent(code, message, meta, layerRef) {
    return {
        code,
        message,
        meta: meta ?? null,
        layerRef: layerRef ?? null,
        timestamp: new Date().toISOString()
    };
}
function normalizeModeSelection(opts) {
    if (opts.modeSelection)
        return opts.modeSelection;
    return {
        live: !opts.replayPath,
        replayPath: opts.replayPath ? node_path_1.default.resolve(process.cwd(), opts.replayPath) : undefined,
        captureReplay: Boolean(opts.captureReplay),
        allowLargeFile: Boolean(opts.allowLargeFile),
        errors: []
    };
}
function createStaticFetchSession(fileKey, nodeId) {
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
function createSyntheticRoot(nodeId) {
    return { id: nodeId, name: 'RootFrame', type: 'FRAME', children: [] };
}
async function runPipeline(opts) {
    const timings = new observability_1.Timings();
    timings.start('total');
    const summaryWarnings = new observability_1.Warnings();
    const trace = new observability_1.TraceBuilder();
    const allWarningEvents = [];
    const addWarning = (event) => {
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
    let rootNode = opts.rootNodeOverride;
    let fetchSession;
    let replayMetadata;
    timings.start('fetch');
    if (!rootNode) {
        if (modeSelection.replayPath) {
            try {
                const replayResult = await (0, connectivity_1.loadReplayArtifact)({
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
                        rootNode = (0, connectivity_1.extractDocument)(payload) ?? createSyntheticRoot(opts.node);
                    }
                    catch {
                        rootNode = createSyntheticRoot(opts.node);
                    }
                }
                else {
                    rootNode = createSyntheticRoot(opts.node);
                }
            }
            catch (error) {
                addWarning(createWarningEvent('REPLAY_INTEGRITY', 'Failed to load replay artifact', {
                    error: error instanceof Error ? error.message : String(error)
                }));
                timings.stop('fetch');
                timings.stop('total');
                return { exitCode: 6, warnings: allWarningEvents };
            }
        }
        else if (modeSelection.live && process.env.FIGMA_TOKEN) {
            const figmaClient = opts.connectivityClient ? undefined : (0, client_1.createFigmaClient)();
            const client = opts.connectivityClient ?? {
                fetchFileNodes: async (fileKey, nodeId) => {
                    return figmaClient.getFileNodes(fileKey, [nodeId]);
                }
            };
            const liveResult = await (0, connectivity_1.runLiveFetchSession)({
                fileKey: opts.file,
                nodeId: opts.node,
                client,
                clock: opts.connectivityClock ?? (0, connectivity_1.createMonotonicClock)(),
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
                const replayResult = await (0, connectivity_1.writeReplayArtifact)({
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
        }
        else {
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
    const scan = (0, prescan_1.preScan)(rootNode, {
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
        addWarning(createWarningEvent('LARGE_FILE_NEAR_LIMIT', `Node count ${scan.nodeCount} exceeded threshold ${thresholds.nodeCount}`, { nodeCount: scan.nodeCount, threshold: thresholds.nodeCount }));
        if (!modeSelection.allowLargeFile) {
            const decision = (0, confirmLargeDoc_1.confirmLargeDocument)({
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
    const traverseResult = (0, traverse_1.traverse)(rootNode, { depthLimit: opts.depthThreshold });
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
    const emission = (0, emit_1.emitComponent)({ componentName, root: traverseResult.root, classList: classes });
    timings.stop('transform');
    timings.start('assets');
    timings.stop('assets');
    timings.start('emit');
    const ensure = await (0, versioning_1.ensureVersionDir)({ outParent: opts.out, baseComponent: componentName });
    const compFile = node_path_1.default.join(ensure.versionDir, `${componentName}.v1.tsx`);
    await node_fs_1.promises.writeFile(compFile, emission, 'utf8');
    timings.stop('emit');
    timings.start('write');
    await (0, versioning_1.updateVersionMap)({ outParent: opts.out, baseComponent: componentName }, ensure, [compFile]);
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
            overrideNotice: (fetchSession.rateLimitCount ?? 0) > 0
                ? 'Rate limit encountered during fetch'
                : null
        }
        : undefined;
    const summary = (0, observability_1.buildSummary)({
        layerCount: effectiveLayerCount,
        componentCount: 1,
        assetCount: 0,
        overrideUsed: opts.overrideWarningThreshold,
        largeDocument,
        versionDir: ensure.versionName,
        variants: [],
        variantConflicts: [],
        timings: timings.record(),
        warnings: summaryWarnings,
        mode: fetchSession?.mode ?? 'static',
        usedNetwork: fetchSession?.usedNetwork ?? false,
        fetchMetrics,
        replay: replayMetadata ?? null
    });
    const summaryPath = node_path_1.default.join(ensure.versionDir, 'summary.json');
    const tracePath = node_path_1.default.join(ensure.versionDir, 'trace.json');
    await node_fs_1.promises.writeFile(summaryPath, JSON.stringify(summary, null, 2));
    if (opts.verboseTrace) {
        await node_fs_1.promises.writeFile(tracePath, JSON.stringify(trace.all(), null, 2));
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
//# sourceMappingURL=run.js.map