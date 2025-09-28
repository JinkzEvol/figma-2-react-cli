"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportAssets = exportAssets;
const sha1_1 = require("../hashing/sha1");
const fs_1 = require("fs");
const path = __importStar(require("path"));
/**
 * Export assets producing deterministic hashed filenames: sanitized-base--hash.ext
 * Collision strategy: if filename already exists with different content, append -N before --hash.
 */
async function exportAssets(inputs, opts) {
    await fs_1.promises.mkdir(opts.outDir, { recursive: true });
    const results = [];
    for (const asset of inputs) {
        const baseSanitized = sanitizeBase(asset.name || 'asset');
        const contentHash = (0, sha1_1.hashContent)(asset.bytes);
        let attempt = 0;
        let filename;
        while (true) {
            const suffix = attempt === 0 ? '' : `-${attempt + 1}`; // start -2 for first collision
            filename = `${baseSanitized}${suffix}--${contentHash}${asset.ext}`;
            const target = path.join(opts.outDir, filename);
            const exists = await fileExists(target);
            if (!exists) {
                if (!opts.dryRun)
                    await fs_1.promises.writeFile(target, asset.bytes);
                results.push({ filename, contentHash, path: target });
                break;
            }
            else {
                // If exists, compare hash of existing content; if identical, reuse without increment
                const existing = await fs_1.promises.readFile(target);
                const existingHash = (0, sha1_1.hashContent)(existing);
                if (existingHash === contentHash) {
                    // identical content; deterministic reuse
                    results.push({ filename, contentHash, path: target });
                    break;
                }
                attempt++;
                opts.onCollision?.(baseSanitized, attempt);
                continue;
            }
        }
    }
    return results.sort((a, b) => a.filename.localeCompare(b.filename));
}
function sanitizeBase(name) {
    return (name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'asset');
}
async function fileExists(p) {
    try {
        await fs_1.promises.access(p);
        return true;
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=export.js.map