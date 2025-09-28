export interface Geometry { width: number; height: number; x?: number; y?: number; }
export interface LayoutDiffIssue { id: string; field: string; expected: number; actual: number; delta: number; }
export interface LayoutDiffResult { issues: LayoutDiffIssue[]; maxDelta: number; }

/**
 * Computes per-layer geometry deltas; tolerates <=1px; returns issues beyond tolerance.
 */
export function diffLayout(expected: Record<string, Geometry>, actual: Record<string, Geometry>, tolerance = 1): LayoutDiffResult {
  const issues: LayoutDiffIssue[] = [];
  const ids = new Set([...Object.keys(expected), ...Object.keys(actual)]);
  for (const id of ids) {
    const e = expected[id];
    const a = actual[id];
    if (!e || !a) continue; // missing nodes ignored for now
    compareField('width', e.width, a.width, id, tolerance, issues);
    compareField('height', e.height, a.height, id, tolerance, issues);
    if (e.x != null && a.x != null) compareField('x', e.x, a.x, id, tolerance, issues);
    if (e.y != null && a.y != null) compareField('y', e.y, a.y, id, tolerance, issues);
  }
  const maxDelta = issues.reduce((m, i) => Math.max(m, i.delta), 0);
  return { issues, maxDelta };
}

function compareField(field: string, expected: number, actual: number, id: string, tolerance: number, issues: LayoutDiffIssue[]) {
  const delta = Math.abs(expected - actual);
  if (delta > tolerance) {
    issues.push({ id, field, expected, actual, delta });
  }
}
