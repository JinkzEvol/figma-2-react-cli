"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.preScan = preScan;
/** Lightweight traversal to approximate size/depth without full transform cost. */
function preScan(root, cfg = {}) {
    const nodeCountThreshold = cfg.nodeCountThreshold ?? 3000;
    const depthThreshold = cfg.depthThreshold ?? 12;
    if (!root || typeof root !== 'object') {
        return { nodeCount: 0, maxDepth: 0, largeDocument: false, reason: 'Invalid root' };
    }
    let count = 0;
    let maxDepth = 0;
    function walk(node, depth) {
        if (!node || typeof node !== 'object')
            return;
        count++;
        if (depth > maxDepth)
            maxDepth = depth;
        const children = Array.isArray(node.children) ? node.children : [];
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
    let reason;
    if (largeDocument) {
        reason = [
            largeByCount ? `nodeCount>${nodeCountThreshold}` : undefined,
            largeByDepth ? `depth>${depthThreshold}` : undefined
        ].filter(Boolean).join(',');
    }
    return { nodeCount: count, maxDepth, largeDocument, reason };
}
//# sourceMappingURL=prescan.js.map