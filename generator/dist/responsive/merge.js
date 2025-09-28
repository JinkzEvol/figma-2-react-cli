"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeVariants = mergeVariants;
/**
 * Variant merger (T038)
 * Produces a data structure representing breakpoint-conditional rendering order base→2xl.
 */
const variants_1 = require("./variants");
function mergeVariants(parsed, payloadLookup) {
    const grouped = {};
    for (const p of parsed) {
        (grouped[p.baseName] = grouped[p.baseName] || []).push(p);
    }
    const results = [];
    for (const base of Object.keys(grouped)) {
        const list = grouped[base];
        const conflicts = [];
        const nodes = [];
        for (const bp of variants_1.ORDERED_BREAKPOINTS) {
            const candidates = list.filter(v => v.breakpoint === bp);
            const chosen = candidates[0];
            if (chosen) {
                if (chosen.conflict || candidates.length > 1)
                    conflicts.push(bp);
                nodes.push({ breakpoint: bp, payload: payloadLookup(chosen.rawName) });
            }
        }
        results.push({ baseName: base, variants: nodes, conflicts });
    }
    // Deterministic ordering by baseName
    results.sort((a, b) => a.baseName.localeCompare(b.baseName));
    return results;
}
//# sourceMappingURL=merge.js.map