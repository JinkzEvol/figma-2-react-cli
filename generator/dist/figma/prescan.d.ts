export interface PreScanConfig {
    nodeCountThreshold?: number;
    depthThreshold?: number;
}
export interface PreScanResult {
    nodeCount: number;
    maxDepth: number;
    largeDocument: boolean;
    reason?: string;
}
/** Lightweight traversal to approximate size/depth without full transform cost. */
export declare function preScan(root: any, cfg?: PreScanConfig): PreScanResult;
