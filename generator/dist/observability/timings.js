"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Timings = void 0;
class Timings {
    map = {
        fetch: {}, preScan: {}, transform: {}, assets: {}, emit: {}, write: {}, total: {}
    };
    start(phase) { this.map[phase].start = performance.now(); }
    stop(phase) {
        const d = this.map[phase];
        if (d.start != null)
            d.duration = performance.now() - d.start;
    }
    record() {
        const out = {};
        for (const p of Object.keys(this.map)) {
            out[p] = Math.round((this.map[p].duration || 0));
        }
        return out;
    }
}
exports.Timings = Timings;
//# sourceMappingURL=timings.js.map