export interface FigmaClientOptions {
    token?: string;
    baseUrl?: string;
    retryDelaysMs?: number[];
}
export interface FigmaRequestMetrics {
    elapsedMs: number;
}
export interface FigmaNodeFetchSuccess<T = any> {
    ok: true;
    status: number;
    data: T;
    metrics: FigmaRequestMetrics;
}
export interface FigmaNodeFetchFailure {
    ok: false;
    status: number;
    error: string;
    retryable: boolean;
    rateLimited: boolean;
    metrics: FigmaRequestMetrics;
}
export type FigmaNodeFetchResult<T = any> = FigmaNodeFetchSuccess<T> | FigmaNodeFetchFailure;
export declare class FigmaRequestError extends Error {
    status: number;
    retryable: boolean;
    rateLimited: boolean;
    constructor(status: number, message: string, retryable: boolean, rateLimited: boolean);
}
export declare class FigmaClient {
    private token;
    private baseUrl;
    private retryDelaysMs;
    constructor(opts?: FigmaClientOptions);
    private authHeaders;
    private parseResponseBody;
    fetchFileNodes<T = any>(fileKey: string, nodeIds: string[]): Promise<FigmaNodeFetchResult<T>>;
    getFileNodes<T = any>(fileKey: string, nodeIds: string[]): Promise<T>;
    getRetrySchedule(): number[];
}
export declare function createFigmaClient(options?: FigmaClientOptions): FigmaClient;
