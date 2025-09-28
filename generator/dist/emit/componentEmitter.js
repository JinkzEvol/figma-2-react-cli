"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitComponent = emitComponent;
/**
 * Deterministic component emitter (T040):
 * - Stateless functional component
 * - Deterministic class ordering: layout→spacing→color→typography→other (caller supplies already bucketed or pre-sorted list; we stable sort by prefix heuristics here)
 * - Children depth-first order preserved
 */
function emitComponent(opts) {
    const classes = (opts.classList || []).slice();
    const ordered = orderClasses(classes);
    const body = renderLayer(opts.root, opts.reuseMap || {});
    return `import React from 'react';\n\nexport const ${opts.componentName} = () => {\n  return (\n    <div className=\"${ordered.join(' ')}\">\n${indent(body, 6)}\n    </div>\n  );\n};\n`;
}
function orderClasses(list) {
    const buckets = {
        layout: [],
        spacing: [],
        color: [],
        typography: [],
        other: []
    };
    for (const c of list) {
        if (/^(flex|grid|absolute|relative|items-|justify-|gap-)/.test(c))
            buckets.layout.push(c);
        else if (/^(p[trblxy]?\-|m[trblxy]?\-)/.test(c))
            buckets.spacing.push(c);
        else if (/^(bg-|text-|border-)/.test(c))
            buckets.color.push(c);
        else if (/^(font-|text\[|leading-|tracking-)/.test(c))
            buckets.typography.push(c);
        else
            buckets.other.push(c);
    }
    return [...buckets.layout, ...buckets.spacing, ...buckets.color, ...buckets.typography, ...buckets.other];
}
function renderLayer(layer, reuseMap, depth = 0) {
    if (reuseMap[layer.id]) {
        // Render component usage
        return `${indent(`<${reuseMap[layer.id]} />`, depth)}`;
    }
    const children = layer.children.map(ch => renderLayer(ch, reuseMap, depth + 2)).join('\n');
    const open = `<div data-node=\"${layer.id}\">`;
    const close = `</div>`;
    return [indent(open, depth), children, indent(close, depth)].filter(Boolean).join('\n');
}
function indent(str, spaces) {
    const pad = ' '.repeat(spaces);
    return str
        .split('\n')
        .map(l => (l.length ? pad + l : l))
        .join('\n');
}
//# sourceMappingURL=componentEmitter.js.map