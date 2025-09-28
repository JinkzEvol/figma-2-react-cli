"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Warnings = void 0;
class Warnings {
    items = [];
    add(code, message, layerRef, meta) {
        this.items.push({
            code,
            message,
            layerRef: layerRef ?? null,
            meta: meta ?? null,
            timestamp: new Date().toISOString()
        });
    }
    addEvent(event) {
        this.items.push({
            code: event.code,
            message: event.message,
            layerRef: event.layerRef ?? null,
            meta: event.meta ?? null,
            timestamp: event.timestamp ?? new Date().toISOString()
        });
    }
    list() {
        return this.items.map((item) => ({
            code: item.code,
            message: item.message,
            layerRef: item.layerRef ?? null,
            meta: item.meta ?? null,
            timestamp: item.timestamp
        }));
    }
    count() {
        return this.items.length;
    }
    has(code) {
        return this.items.some((w) => w.code === code);
    }
}
exports.Warnings = Warnings;
//# sourceMappingURL=warnings.js.map