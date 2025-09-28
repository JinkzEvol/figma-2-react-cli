"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapTypography = mapTypography;
function weightToClass(weight) {
    if (!weight)
        return undefined;
    if (weight >= 700)
        return 'font-bold';
    if (weight >= 600)
        return 'font-semibold';
    if (weight >= 500)
        return 'font-medium';
    if (weight <= 300)
        return 'font-light';
    return 'font-normal';
}
function fontSizeToClass(size) {
    if (!size)
        return undefined;
    // For now map to arbitrary value (later: scale mapping heuristic)
    return `text-[${Math.round(size)}px]`;
}
function lineHeightToClass(size, lineHeightPx) {
    if (!size || !lineHeightPx)
        return undefined;
    const ratio = lineHeightPx / size;
    // Use ratio to two decimals; fallback to arbitrary line-height
    const rounded = Math.round(ratio * 100) / 100;
    return `leading-[${rounded}]`;
}
function letterSpacingToClass(ls) {
    if (ls == null || ls === 0)
        return undefined;
    const rounded = Math.round(ls * 100) / 100;
    return `tracking-[${rounded}px]`;
}
function colorToClass(color) {
    if (!color)
        return undefined;
    // Basic hex normalization (#RRGGBB) – if fails, use arbitrary color value utility.
    const hexMatch = color.match(/^#([0-9a-fA-F]{6})$/);
    if (hexMatch)
        return `text-[${hexMatch[0]}]`;
    return `text-[${color}]`;
}
function mapTypography(input) {
    const classes = [];
    const add = (c) => c && classes.push(c);
    add(weightToClass(input.fontWeight));
    add(fontSizeToClass(input.fontSize));
    add(lineHeightToClass(input.fontSize, input.lineHeightPx));
    add(letterSpacingToClass(input.letterSpacing));
    add(colorToClass(input.color));
    return { classes };
}
//# sourceMappingURL=typography.js.map