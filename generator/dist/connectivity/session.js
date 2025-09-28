"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMonotonicClock = createMonotonicClock;
exports.extractDocument = extractDocument;
exports.runLiveFetchSession = runLiveFetchSession;
const node_perf_hooks_1 = require("node:perf_hooks");
const DEFAULT_RETRY_SCHEDULE = [500, 1000, 2000, 4000];
const DEFAULT_MAX_DURATION = 120_000;
function createWarning(code, message, meta) {
    return {
        code,
        message,
        meta: meta ?? null,
        layerRef: null,
        timestamp: new Date().toISOString()
    };
}
function createMonotonicClock() {
    return {
        now: () => node_perf_hooks_1.performance.now(),
        sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms))
    };
}
function extractDocument(payload) {
    if (!payload)
        return undefined;
    if (payload.document)
        return payload.document;
    if (payload.nodes && typeof payload.nodes === 'object') {
        const values = Object.values(payload.nodes);
        if (values.length > 0 && values[0]?.document) {
            return values[0].document;
        }
    }
    return payload;
}
async function runLiveFetchSession(options) {
    const clock = options.clock ?? createMonotonicClock();
    const retrySchedule = options.retryDelaysMs && options.retryDelaysMs.length > 0 ? options.retryDelaysMs : DEFAULT_RETRY_SCHEDULE;
    const maxDuration = options.maxDurationMs ?? DEFAULT_MAX_DURATION;
    const startTime = clock.now();
    let totalRequests = 0;
    let retryCount = 0;
    let retryBudgetMs = 0;
    let exitCode = 0;
    let termination = 'success';
    const warnings = [];
    const segments = [];
    let document;
    let timeoutCount = 0;
    let rateLimitCount = 0;
    let authFailureCount = 0;
    for (let attempt = 0;; attempt++) {
        if (clock.now() - startTime >= maxDuration) {
            termination = 'timeout';
            exitCode = 6;
            timeoutCount++;
            warnings.push(createWarning('RETRY_USED', 'Fetch aborted after exceeding retry budget', { maxDurationMs: maxDuration }));
            break;
        }
        totalRequests++;
        try {
            const payload = await options.client.fetchFileNodes(options.fileKey, options.nodeId);
            document = extractDocument(payload);
            const recordedAt = new Date().toISOString();
            segments.push({
                id: `GET-file-${options.fileKey}-${options.nodeId}`,
                request: {
                    method: 'GET',
                    path: `/v1/files/${options.fileKey}/nodes`,
                    query: { ids: options.nodeId },
                    headers: { accept: 'application/json' }
                },
                response: {
                    status: 200,
                    headers: { 'content-type': 'application/json' },
                    body: JSON.stringify(payload),
                    recordedAt
                },
                source: 'network'
            });
            termination = 'success';
            exitCode = 0;
            const captureTime = recordedAt;
            const fetchElapsedMs = Math.max(0, clock.now() - startTime);
            const session = {
                fileKey: options.fileKey,
                entryNodeId: options.nodeId,
                mode: 'live',
                usedNetwork: true,
                totalRequests,
                retryCount,
                fetchElapsedMs,
                retryBudgetMs,
                termination,
                exitCode,
                warnings,
                capturedAt: captureTime,
                timeouts: timeoutCount,
                rateLimitCount,
                authorizationFailures: authFailureCount
            };
            return {
                session,
                document,
                warnings,
                segments
            };
        }
        catch (error) {
            const status = typeof error?.status === 'number' ? error.status : 500;
            const retryable = Boolean(error?.retryable);
            if (status === 429) {
                rateLimitCount++;
            }
            if (status === 401 || status === 403) {
                termination = 'auth';
                exitCode = 7;
                authFailureCount++;
                warnings.push(createWarning('API_AUTH_FAILURE', 'Figma API authentication failed', { status }));
                break;
            }
            if (!retryable) {
                termination = 'integrity';
                exitCode = 6;
                warnings.push(createWarning('RETRY_USED', error?.message ? String(error.message) : 'Non-retryable error encountered'));
                break;
            }
            if (attempt >= retrySchedule.length) {
                termination = status === 429 ? 'rate-limit' : 'timeout';
                exitCode = 6;
                if (status === 429) {
                    warnings.push(createWarning('API_RATE_LIMIT', 'Figma API rate limit exhausted', { attempts: totalRequests }));
                }
                else {
                    timeoutCount++;
                    warnings.push(createWarning('RETRY_USED', 'Retry budget exhausted', { attempts: totalRequests }));
                }
                break;
            }
            const delay = retrySchedule[attempt];
            retryCount++;
            retryBudgetMs = Math.min(retryBudgetMs + delay, 7500);
            warnings.push(createWarning('RETRY_USED', `Retrying after transient error`, { attempt: attempt + 1, status }));
            await clock.sleep(delay);
        }
    }
    const fetchElapsedMs = Math.max(0, clock.now() - startTime);
    const session = {
        fileKey: options.fileKey,
        entryNodeId: options.nodeId,
        mode: 'live',
        usedNetwork: true,
        totalRequests,
        retryCount,
        fetchElapsedMs,
        retryBudgetMs,
        termination,
        exitCode,
        warnings,
        timeouts: timeoutCount,
        rateLimitCount,
        authorizationFailures: authFailureCount
    };
    return {
        session,
        document,
        warnings,
        segments
    };
}
//# sourceMappingURL=session.js.map