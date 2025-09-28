"use strict";
/**
 * Fallback absolute positioning mapper for non-auto layout frames/groups.
 * Produces style object snippet or Tailwind classes approximating absolute placement.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapAbsolutePosition = mapAbsolutePosition;
function mapAbsolutePosition(p) {
    const style = {
        position: 'absolute',
        left: `${Math.round(p.x)}px`,
        top: `${Math.round(p.y)}px`,
        width: `${Math.round(p.width)}px`,
        height: `${Math.round(p.height)}px`
    };
    // We use arbitrary value utilities for precision; could compress later.
    const classes = ['absolute'];
    return { classes, style: { ...style } };
}
//# sourceMappingURL=absolute.js.map