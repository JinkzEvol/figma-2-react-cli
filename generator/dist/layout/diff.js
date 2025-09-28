"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.diffLayout = diffLayout;
/**
 * Computes per-layer geometry deltas; tolerates <=1px; returns issues beyond tolerance.
 */
function diffLayout(expected, actual, tolerance = 1) {
    const issues = [];
    const ids = new Set([...Object.keys(expected), ...Object.keys(actual)]);
    for (const id of ids) {
        const e = expected[id];
        const a = actual[id];
        if (!e || !a)
            continue; // missing nodes ignored for now
        compareField('width', e.width, a.width, id, tolerance, issues);
        compareField('height', e.height, a.height, id, tolerance, issues);
        if (e.x != null && a.x != null)
            compareField('x', e.x, a.x, id, tolerance, issues);
        if (e.y != null && a.y != null)
            compareField('y', e.y, a.y, id, tolerance, issues);
    }
    const maxDelta = issues.reduce((m, i) => Math.max(m, i.delta), 0);
    return { issues, maxDelta };
}
function compareField(field, expected, actual, id, tolerance, issues) {
    const delta = Math.abs(expected - actual);
    if (delta > tolerance) {
        issues.push({ id, field, expected, actual, delta });
    }
}
//# sourceMappingURL=diff.js.map