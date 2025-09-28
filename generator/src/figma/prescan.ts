export interface PreScanConfig {
  nodeCountThreshold?: number; // default 3000
  depthThreshold?: number; // default 12
}

export interface PreScanResult {
  nodeCount: number;
  maxDepth: number;
  largeDocument: boolean;
  reason?: string; // explanation if largeDocument = true
}

/** Lightweight traversal to approximate size/depth without full transform cost. */
export function preScan(root: any, cfg: PreScanConfig = {}): PreScanResult {
  const nodeCountThreshold = cfg.nodeCountThreshold ?? 3000;
  const depthThreshold = cfg.depthThreshold ?? 12;

  if (!root || typeof root !== 'object') {
    return { nodeCount: 0, maxDepth: 0, largeDocument: false, reason: 'Invalid root' };
  }

  let count = 0;
  let maxDepth = 0;

  function walk(node: any, depth: number) {
    if (!node || typeof node !== 'object') return;
    count++;
    if (depth > maxDepth) maxDepth = depth;
    const children: any[] = Array.isArray(node.children) ? node.children : [];
    for (const child of children) {
      walk(child, depth + 1);
      if (count > nodeCountThreshold * 1.2) { // early escape if far over threshold
        return;
      }
    }
  }

  walk(root, 1);

  const largeByCount = count > nodeCountThreshold;
  const largeByDepth = maxDepth > depthThreshold;
  const largeDocument = largeByCount || largeByDepth;
  let reason: string | undefined;
  if (largeDocument) {
    reason = [
      largeByCount ? `nodeCount>${nodeCountThreshold}` : undefined,
      largeByDepth ? `depth>${depthThreshold}` : undefined
    ].filter(Boolean).join(',');
  }

  return { nodeCount: count, maxDepth, largeDocument, reason };
}
