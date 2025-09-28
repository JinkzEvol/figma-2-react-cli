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
    classes: string[];
    style: {
        [k: string]: string | number;
    };
}
export declare function mapAbsolutePosition(p: AbsolutePositionProps): AbsolutePositionResult;
