/**
 * Font embedding / fallback logic (T056)
 * Simplified: attempts to resolve a provided font family against an allowlist.
 * If not present, applies a deterministic fallback stack and records a warning via callback.
 */
export interface ResolveFontOptions {
    fontFamily?: string;
    availableFamilies?: string[];
    warn?: (code: string, message: string) => void;
}
export interface ResolvedFont {
    primary: string;
    stack: string[];
    substituted: boolean;
    original?: string;
}
export declare function resolveFont(opts: ResolveFontOptions): ResolvedFont;
export declare function fontStackToClass(resolved: ResolvedFont): string;
