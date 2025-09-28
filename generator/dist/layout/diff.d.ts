export interface Geometry {
    width: number;
    height: number;
    x?: number;
    y?: number;
}
export interface LayoutDiffIssue {
    id: string;
    field: string;
    expected: number;
    actual: number;
    delta: number;
}
export interface LayoutDiffResult {
    issues: LayoutDiffIssue[];
    maxDelta: number;
}
/**
 * Computes per-layer geometry deltas; tolerates <=1px; returns issues beyond tolerance.
 */
export declare function diffLayout(expected: Record<string, Geometry>, actual: Record<string, Geometry>, tolerance?: number): LayoutDiffResult;
