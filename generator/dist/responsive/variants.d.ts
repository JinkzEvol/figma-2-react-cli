/**
 * Variant parser (T037)
 * Parses frame/component names for breakpoint suffix patterns and classifies.
 * Pattern supports name@bp or name.bp with bp in base|sm|md|lg|xl|2xl
 * If suffix absent, width classification fallback can be applied later (not implemented yet).
 */
export type Breakpoint = 'base' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export declare const ORDERED_BREAKPOINTS: Breakpoint[];
export interface VariantParseResult {
    baseName: string;
    breakpoint: Breakpoint;
    rawName: string;
    conflict?: boolean;
}
export interface ParseVariantsOptions {
    warn?: (msg: string) => void;
}
export declare function parseVariantName(rawName: string): {
    baseName: string;
    breakpoint: Breakpoint;
} | null;
export declare function parseVariants(names: string[], opts?: ParseVariantsOptions): VariantParseResult[];
