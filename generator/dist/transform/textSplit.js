"use strict";
/**
 * Multi-style text splitter (T032).
 * Given a raw text string and style ranges, produces ordered segments with associated style indexes.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.splitText = splitText;
function splitText(raw, ranges) {
    if (!raw)
        return [];
    if (!Array.isArray(ranges) || ranges.length === 0) {
        return [{ text: raw, styleId: 'default' }];
    }
    // Normalize & sort ranges
    const normalized = ranges
        .map(r => ({ ...r, start: Math.max(0, r.start), end: Math.min(raw.length, r.end) }))
        .filter(r => r.end > r.start)
        .sort((a, b) => a.start - b.start || a.end - b.end);
    const result = [];
    let cursor = 0;
    for (const r of normalized) {
        if (r.start > cursor) {
            result.push({ text: raw.slice(cursor, r.start), styleId: 'default' });
        }
        result.push({ text: raw.slice(r.start, r.end), styleId: r.styleId });
        cursor = r.end;
    }
    if (cursor < raw.length) {
        result.push({ text: raw.slice(cursor), styleId: 'default' });
    }
    return result;
}
//# sourceMappingURL=textSplit.js.map