import { LayerNode, TraverseOptions, TraverseResult } from './models';
import { canonicalize } from '../hashing/canonical';

interface RawNode {
  id: string;
  name?: string;
  type?: string;
  absoluteBoundingBox?: { x: number; y: number; width: number; height: number };
  children?: RawNode[];
  // Additional Figma fields ignored for now
}

const IGNORE_PREFIX = /^_ignore/i;
const DEFAULT_DEPTH_LIMIT = 25;

export function traverse(root: RawNode, options: TraverseOptions = {}): TraverseResult {
  const depthLimit = options.depthLimit ?? DEFAULT_DEPTH_LIMIT;
  const warnings: TraverseResult['warnings'] = [];
  const allLayers: LayerNode[] = [];

  function toBounds(node: RawNode) {
    const bb = node.absoluteBoundingBox || { x: 0, y: 0, width: 0, height: 0 };
    return { x: bb.x ?? 0, y: bb.y ?? 0, width: bb.width ?? 0, height: bb.height ?? 0 };
  }

  function walk(node: RawNode, depth: number): LayerNode | null {
    if (!node || typeof node !== 'object') return null;
    const name = node.name || '';
    const isIgnored = IGNORE_PREFIX.test(name);
    const layer: LayerNode = {
      id: node.id,
      name,
      type: node.type || 'UNKNOWN',
      bounds: toBounds(node),
      styles: undefined,
      children: [],
      isIgnored,
      hashBasis: undefined
    };

    // Compute hash basis (basic for now: id+type+name+bounds) – refined later with styles
    layer.hashBasis = canonicalize({ id: layer.id, t: layer.type, n: layer.name, b: layer.bounds });
    allLayers.push(layer);

    if (depth >= depthLimit) {
      warnings.push({ code: 'DEPTH_LIMIT_REACHED', message: `Depth limit ${depthLimit} reached at ${node.id}`, layerRef: node.id });
      return layer;
    }

    const rawChildren = Array.isArray(node.children) ? node.children : [];
    for (const child of rawChildren) {
      const childLayer = walk(child, depth + 1);
      if (childLayer) layer.children.push(childLayer);
    }
    return layer;
  }

  const rootLayer = walk(root, 1) || {
    id: 'root-missing',
    name: 'root-missing',
    type: 'UNKNOWN',
    bounds: { x: 0, y: 0, width: 0, height: 0 },
    styles: undefined,
    children: [],
    isIgnored: false,
    hashBasis: canonicalize({})
  };

  return { root: rootLayer, allLayers, warnings };
}
