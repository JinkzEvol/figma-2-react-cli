/**
 * Variant merger (T038)
 * Produces a data structure representing breakpoint-conditional rendering order base→2xl.
 */
import { VariantParseResult, Breakpoint } from './variants';
export interface VariantNode<T = any> {
    breakpoint: Breakpoint;
    payload: T;
}
export interface MergedVariants<T = any> {
    baseName: string;
    variants: VariantNode<T>[];
    conflicts: Breakpoint[];
}
export declare function mergeVariants<T>(parsed: VariantParseResult[], payloadLookup: (rawName: string) => T): MergedVariants[];
