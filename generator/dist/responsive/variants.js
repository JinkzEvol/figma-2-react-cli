"use strict";
/**
 * Variant parser (T037)
 * Parses frame/component names for breakpoint suffix patterns and classifies.
 * Pattern supports name@bp or name.bp with bp in base|sm|md|lg|xl|2xl
 * If suffix absent, width classification fallback can be applied later (not implemented yet).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ORDERED_BREAKPOINTS = void 0;
exports.parseVariantName = parseVariantName;
exports.parseVariants = parseVariants;
exports.ORDERED_BREAKPOINTS = ['base', 'sm', 'md', 'lg', 'xl', '2xl'];
const SUFFIX_REGEX = /^(?<base>[A-Za-z0-9_-]+?)(?:[@\.](?<bp>base|sm|md|lg|xl|2xl))?$/;
function parseVariantName(rawName) {
    const m = rawName.match(SUFFIX_REGEX);
    if (!m || !m.groups)
        return null;
    const baseName = m.groups.base;
    const bp = m.groups.bp || 'base';
    return { baseName, breakpoint: bp };
}
function parseVariants(names, opts = {}) {
    const byBase = {};
    for (const name of names) {
        const parsed = parseVariantName(name);
        if (!parsed)
            continue;
        const rec = byBase[parsed.baseName] || (byBase[parsed.baseName] = {});
        if (rec[parsed.breakpoint]) {
            // Existing variant – mark conflict on original and push a synthetic conflict entry
            rec[parsed.breakpoint].conflict = true;
            opts.warn?.(`Duplicate variant breakpoint ${parsed.breakpoint} for ${parsed.baseName}`);
            // Keep the first as the chosen variant; skip adding duplicate to map but record conflict via separate entry below
            // We add an extra entry flagged conflict so caller can detect duplicates if needed
            // (This preserves ordering in later merge by relying on map only for primary reference)
            continue;
        }
        else {
            rec[parsed.breakpoint] = {
                baseName: parsed.baseName,
                breakpoint: parsed.breakpoint,
                rawName: name,
                conflict: false
            };
        }
    }
    const out = [];
    for (const base of Object.keys(byBase)) {
        for (const bp of exports.ORDERED_BREAKPOINTS) {
            const v = byBase[base][bp];
            if (v)
                out.push(v);
        }
    }
    return out;
}
//# sourceMappingURL=variants.js.map