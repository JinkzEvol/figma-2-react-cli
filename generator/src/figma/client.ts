import { request } from 'undici';
import { performance } from 'node:perf_hooks';

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

export class FigmaRequestError extends Error {
  status: number;
  retryable: boolean;
  rateLimited: boolean;

  constructor(status: number, message: string, retryable: boolean, rateLimited: boolean) {
    super(message);
    this.status = status;
    this.retryable = retryable;
    this.rateLimited = rateLimited;
  }
}

function isRetryable(status: number): boolean {
  if (status === 429) return true;
  if (status === 408) return true;
  if (status >= 500 && status < 600) return true;
  return false;
}

export class FigmaClient {
  private token: string | undefined;
  private baseUrl: string;
  private retryDelaysMs: number[];

  constructor(opts: FigmaClientOptions = {}) {
    this.token = opts.token || process.env.FIGMA_TOKEN;
    this.baseUrl = (opts.baseUrl || 'https://api.figma.com/v1').replace(/\/$/, '');
    this.retryDelaysMs = opts.retryDelaysMs ?? [500, 1000, 2000, 4000];
  }

  private authHeaders(): Record<string, string> {
    if (!this.token) throw new Error('Missing FIGMA_TOKEN');
    return { Authorization: `Bearer ${this.token}` };
  }

  private async parseResponseBody(res: Awaited<ReturnType<typeof request>>): Promise<string> {
    const text = await res.body.text();
    return text ?? '';
  }

  async fetchFileNodes<T = any>(fileKey: string, nodeIds: string[]): Promise<FigmaNodeFetchResult<T>> {
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

    const start = performance.now();
    try {
      const res = await request(url, {
        method: 'GET',
        headers: {
          ...this.authHeaders(),
          'Content-Type': 'application/json'
        }
      });
      const elapsedMs = performance.now() - start;
      const status = res.statusCode;
      const body = await this.parseResponseBody(res);
      const rateLimited = status === 429;

      if (status >= 200 && status < 300) {
        let data: T;
        try {
          data = JSON.parse(body) as T;
        } catch (parseError: any) {
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
    } catch (error: any) {
      const elapsedMs = performance.now() - start;
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

  async getFileNodes<T = any>(fileKey: string, nodeIds: string[]): Promise<T> {
    const result = await this.fetchFileNodes<T>(fileKey, nodeIds);
    if (!result.ok) {
      throw new FigmaRequestError(result.status, result.error, result.retryable, result.rateLimited);
    }
    return result.data;
  }

  getRetrySchedule(): number[] {
    return this.retryDelaysMs.slice();
  }
}

export function createFigmaClient(options?: FigmaClientOptions) {
  return new FigmaClient(options);
}
