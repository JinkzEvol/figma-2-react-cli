/**
 * Color token resolver (T031).
 * Maps RGBA / HEX to a defined palette; falls back to arbitrary utility + logs fallback.
 */
export interface ColorResolverOptions {
    palette?: Record<string, string>;
    onFallback?: (input: string) => void;
}
export declare function resolveColor(input: string, opts?: ColorResolverOptions): string;
declare function normalizeHex(color: string): string;
export { normalizeHex };
