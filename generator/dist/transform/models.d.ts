export interface Bounds {
    x: number;
    y: number;
    width: number;
    height: number;
}
export interface LayerNode {
    id: string;
    name: string;
    type: string;
    bounds: Bounds;
    styles?: Record<string, any>;
    children: LayerNode[];
    isIgnored: boolean;
    hashBasis?: string;
}
export interface ComponentDefinition {
    name: string;
    occurrences: number;
    sourceNodeIds: string[];
}
export interface AssetRef {
    originalNodeId: string;
    filename: string;
    contentHash: string;
    type: 'image' | 'svg';
    sizeBytes?: number;
}
export interface TraverseOptions {
    depthLimit?: number;
}
export interface TraverseResult {
    root: LayerNode;
    allLayers: LayerNode[];
    warnings: {
        code: string;
        message: string;
        layerRef?: string;
    }[];
}
