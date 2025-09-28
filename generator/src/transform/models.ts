// Intermediate models derived from data-model.md (simplified for transform phase)

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
  hashBasis?: string; // canonical fragment used for reuse hashing
}

export interface ComponentDefinition {
  name: string; // PascalCase
  occurrences: number;
  sourceNodeIds: string[];
}

export interface AssetRef {
  originalNodeId: string;
  filename: string; // sanitized--hash.ext
  contentHash: string; // 8 char
  type: 'image' | 'svg';
  sizeBytes?: number;
}

export interface TraverseOptions {
  depthLimit?: number; // default 25
}

export interface TraverseResult {
  root: LayerNode;
  allLayers: LayerNode[]; // flattened depth-first order
  warnings: { code: string; message: string; layerRef?: string }[];
}
