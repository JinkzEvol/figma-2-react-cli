"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FigmaClient = exports.FigmaRequestError = void 0;
exports.createFigmaClient = createFigmaClient;
const undici_1 = require("undici");
const node_perf_hooks_1 = require("node:perf_hooks");
class FigmaRequestError extends Error {
    status;
    retryable;
    rateLimited;
    constructor(status, message, retryable, rateLimited) {
        super(message);
        this.status = status;
        this.retryable = retryable;
        this.rateLimited = rateLimited;
    }
}
exports.FigmaRequestError = FigmaRequestError;
function isRetryable(status) {
    if (status === 429)
        return true;
    if (status === 408)
        return true;
    if (status >= 500 && status < 600)
        return true;
    return false;
}
class FigmaClient {
    token;
    baseUrl;
    retryDelaysMs;
    constructor(opts = {}) {
        this.token = opts.token || process.env.FIGMA_TOKEN;
        this.baseUrl = (opts.baseUrl || 'https://api.figma.com/v1').replace(/\/$/, '');
        this.retryDelaysMs = opts.retryDelaysMs ?? [500, 1000, 2000, 4000];
    }
    authHeaders() {
        if (!this.token)
            throw new Error('Missing FIGMA_TOKEN');
        return { 'X-Figma-Token': this.token };
    }
    async parseResponseBody(res) {
        const text = await res.body.text();
        return text ?? '';
    }
    async fetchFileNodes(fileKey, nodeIds) {
        if (!Array.isArray(nodeIds) || nodeIds.length === 0) {
            return {
                ok: false,
                status: 400,
                error: 'No nodeIds provided',
                retryable: false,
                rateLimited: false,
                metrics: { elapsedMs: 0 }
            };
        }
        const search = new URLSearchParams();
        search.set('ids', nodeIds.join(','));
        const url = `${this.baseUrl}/files/${encodeURIComponent(fileKey)}/nodes?${search.toString()}`;
        const start = node_perf_hooks_1.performance.now();
        try {
            const res = await (0, undici_1.request)(url, {
                method: 'GET',
                headers: {
                    ...this.authHeaders(),
                    'Content-Type': 'application/json'
                }
            });
            const elapsedMs = node_perf_hooks_1.performance.now() - start;
            const status = res.statusCode;
            const body = await this.parseResponseBody(res);
            const rateLimited = status === 429;
            if (status >= 200 && status < 300) {
                let data;
                try {
                    data = JSON.parse(body);
                }
                catch (parseError) {
                    return {
                        ok: false,
                        status: 500,
                        error: `Invalid JSON: ${parseError.message ?? String(parseError)}`,
                        retryable: true,
                        rateLimited: false,
                        metrics: { elapsedMs }
                    };
                }
                return {
                    ok: true,
                    status,
                    data,
                    metrics: { elapsedMs }
                };
            }
            return {
                ok: false,
                status,
                error: body || `HTTP ${status}`,
                retryable: isRetryable(status),
                rateLimited,
                metrics: { elapsedMs }
            };
        }
        catch (error) {
            const elapsedMs = node_perf_hooks_1.performance.now() - start;
            return {
                ok: false,
                status: 500,
                error: error?.message ?? String(error),
                retryable: true,
                rateLimited: false,
                metrics: { elapsedMs }
            };
        }
    }
    async getFileNodes(fileKey, nodeIds) {
        const result = await this.fetchFileNodes(fileKey, nodeIds);
        if (!result.ok) {
            throw new FigmaRequestError(result.status, result.error, result.retryable, result.rateLimited);
        }
        return result.data;
    }
    getRetrySchedule() {
        return this.retryDelaysMs.slice();
    }
}
exports.FigmaClient = FigmaClient;
function createFigmaClient(options) {
    return new FigmaClient(options);
}
//# sourceMappingURL=client.js.map