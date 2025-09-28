/**
 * Fallback absolute positioning mapper for non-auto layout frames/groups.
 * Produces style object snippet or Tailwind classes approximating absolute placement.
 */

export interface AbsolutePositionProps {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AbsolutePositionResult {
  classes: string[]; // Tailwind utility approximations
  style: { [k: string]: string | number };
}

export function mapAbsolutePosition(p: AbsolutePositionProps): AbsolutePositionResult {
  const style = {
    position: 'absolute',
    left: `${Math.round(p.x)}px`,
    top: `${Math.round(p.y)}px`,
    width: `${Math.round(p.width)}px`,
    height: `${Math.round(p.height)}px`
  } as const;

  // We use arbitrary value utilities for precision; could compress later.
  const classes = ['absolute'];
  return { classes, style: { ...style } };
}
