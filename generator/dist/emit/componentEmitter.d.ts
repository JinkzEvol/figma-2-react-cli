import { LayerNode } from '../transform/models';
export interface EmitComponentOptions {
    componentName: string;
    root: LayerNode;
    classList?: string[];
    reuseMap?: Record<string, string>;
}
/**
 * Deterministic component emitter (T040):
 * - Stateless functional component
 * - Deterministic class ordering: layout→spacing→color→typography→other (caller supplies already bucketed or pre-sorted list; we stable sort by prefix heuristics here)
 * - Children depth-first order preserved
 */
export declare function emitComponent(opts: EmitComponentOptions): string;
