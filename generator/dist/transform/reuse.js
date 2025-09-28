"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectReuse = detectReuse;
function detectReuse(layers) {
    const nameBuckets = {};
    for (const layer of layers) {
        if (layer.isIgnored)
            continue;
        if (!layer.name)
            continue;
        (nameBuckets[layer.name] = nameBuckets[layer.name] || []).push(layer);
    }
    const components = [];
    const componentMap = {};
    for (const [name, bucket] of Object.entries(nameBuckets)) {
        if (bucket.length < 2)
            continue;
        const compName = toPascalCase(name);
        const def = {
            name: compName,
            occurrences: bucket.length,
            sourceNodeIds: bucket.map(b => b.id)
        };
        components.push(def);
        for (const b of bucket)
            componentMap[b.id] = compName;
    }
    // Sort components for determinism (name ASC)
    components.sort((a, b) => a.name.localeCompare(b.name));
    return { components, componentMap };
}
function toPascalCase(name) {
    return name
        .replace(/[^A-Za-z0-9]+/g, ' ') // non-alphanum to space
        .split(' ')
        .filter(Boolean)
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join('');
}
//# sourceMappingURL=reuse.js.map