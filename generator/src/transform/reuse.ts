/**
 * Component reuse detection (T033).
 * Groups repeated layer names (case-sensitive) exceeding 1 occurrence into component definitions.
 */
import { LayerNode, ComponentDefinition } from './models';

export interface ReuseDetectionResult {
  components: ComponentDefinition[];
  componentMap: Record<string, string>; // layer id -> component name
}

export function detectReuse(layers: LayerNode[]): ReuseDetectionResult {
  const nameBuckets: Record<string, LayerNode[]> = {};
  for (const layer of layers) {
    if (layer.isIgnored) continue;
    if (!layer.name) continue;
    (nameBuckets[layer.name] = nameBuckets[layer.name] || []).push(layer);
  }
  const components: ComponentDefinition[] = [];
  const componentMap: Record<string, string> = {};
  for (const [name, bucket] of Object.entries(nameBuckets)) {
    if (bucket.length < 2) continue;
    const compName = toPascalCase(name);
    const def: ComponentDefinition = {
      name: compName,
      occurrences: bucket.length,
      sourceNodeIds: bucket.map(b => b.id)
    };
    components.push(def);
    for (const b of bucket) componentMap[b.id] = compName;
  }
  // Sort components for determinism (name ASC)
  components.sort((a, b) => a.name.localeCompare(b.name));
  return { components, componentMap };
}

function toPascalCase(name: string): string {
  return name
    .replace(/[^A-Za-z0-9]+/g, ' ') // non-alphanum to space
    .split(' ')
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}
