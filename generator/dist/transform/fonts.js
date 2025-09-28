"use strict";
/**
 * Font embedding / fallback logic (T056)
 * Simplified: attempts to resolve a provided font family against an allowlist.
 * If not present, applies a deterministic fallback stack and records a warning via callback.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveFont = resolveFont;
exports.fontStackToClass = fontStackToClass;
// Deterministic minimal fallback stacks (extendable later)
const FALLBACK_STACKS = {
    'inter': ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
    'roboto': ['Roboto', 'ui-sans-serif', 'system-ui', 'sans-serif'],
    'default-sans': ['ui-sans-serif', 'system-ui', 'sans-serif'],
    'default-serif': ['ui-serif', 'Georgia', 'serif'],
    'default-mono': ['ui-monospace', 'SFMono-Regular', 'monospace']
};
const NORMALIZE = /[^a-z0-9]+/g;
function canonicalKey(name) {
    if (!name)
        return undefined;
    return name.toLowerCase().replace(NORMALIZE, '-');
}
function resolveFont(opts) {
    const requested = opts.fontFamily?.trim();
    const key = canonicalKey(requested);
    const available = (opts.availableFamilies || []).map(canonicalKey);
    if (requested && key && available.includes(key)) {
        // Provided font is available → pick an appropriate known stack if we have one.
        const stack = FALLBACK_STACKS[key] || [requested, 'ui-sans-serif', 'system-ui', 'sans-serif'];
        return { primary: stack[0], stack, substituted: false, original: requested };
    }
    // Try heuristic mapping by category keywords
    let stack;
    if (key && key.includes('serif'))
        stack = FALLBACK_STACKS['default-serif'];
    else if (key && (key.includes('mono') || key.includes('code')))
        stack = FALLBACK_STACKS['default-mono'];
    else if (key && FALLBACK_STACKS[key])
        stack = FALLBACK_STACKS[key];
    if (!stack) {
        stack = FALLBACK_STACKS['default-sans'];
    }
    if (requested && opts.warn) {
        opts.warn('FONT_SUBSTITUTED', `Font "${requested}" not available; substituted with ${stack[0]}`);
    }
    return { primary: stack[0], stack, substituted: true, original: requested };
}
function fontStackToClass(resolved) {
    // Tailwind arbitrary font-family utility
    const css = resolved.stack.map(f => (f.includes(' ') ? `"${f}"` : f)).join(',');
    return `font-[${css}]`;
}
//# sourceMappingURL=fonts.js.map