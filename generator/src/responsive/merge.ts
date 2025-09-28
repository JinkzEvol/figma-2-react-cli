/**
 * Variant merger (T038)
 * Produces a data structure representing breakpoint-conditional rendering order base→2xl.
 */
import { ORDERED_BREAKPOINTS, VariantParseResult, Breakpoint } from './variants';

export interface VariantNode<T = any> {
  breakpoint: Breakpoint;
  payload: T; // placeholder for actual rendered node/component reference
}

export interface MergedVariants<T = any> {
  baseName: string;
  variants: VariantNode<T>[]; // ordered
  conflicts: Breakpoint[]; // list of breakpoints that had conflicts
}

export function mergeVariants<T>(parsed: VariantParseResult[], payloadLookup: (rawName: string) => T): MergedVariants[] {
  const grouped: Record<string, VariantParseResult[]> = {};
  for (const p of parsed) {
    (grouped[p.baseName] = grouped[p.baseName] || []).push(p);
  }
  const results: MergedVariants[] = [];
  for (const base of Object.keys(grouped)) {
    const list = grouped[base];
    const conflicts: Breakpoint[] = [];
    const nodes: VariantNode[] = [];
    for (const bp of ORDERED_BREAKPOINTS) {
      const candidates = list.filter(v => v.breakpoint === bp);
      const chosen = candidates[0];
      if (chosen) {
        if (chosen.conflict || candidates.length > 1) conflicts.push(bp);
        nodes.push({ breakpoint: bp, payload: payloadLookup(chosen.rawName) });
      }
    }
    results.push({ baseName: base, variants: nodes, conflicts });
  }
  // Deterministic ordering by baseName
  results.sort((a, b) => a.baseName.localeCompare(b.baseName));
  return results;
}
