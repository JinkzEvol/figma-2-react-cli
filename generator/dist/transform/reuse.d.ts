/**
 * Component reuse detection (T033).
 * Groups repeated layer names (case-sensitive) exceeding 1 occurrence into component definitions.
 */
import { LayerNode, ComponentDefinition } from './models';
export interface ReuseDetectionResult {
    components: ComponentDefinition[];
    componentMap: Record<string, string>;
}
export declare function detectReuse(layers: LayerNode[]): ReuseDetectionResult;
