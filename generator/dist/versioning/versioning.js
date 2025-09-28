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
exports.ensureVersionDir = ensureVersionDir;
exports.updateVersionMap = updateVersionMap;
const fs_1 = require("fs");
const path = __importStar(require("path"));
const sha1_1 = require("../hashing/sha1");
const VERSION_MAP_FILE = 'version-map.json';
async function ensureVersionDir(opts) {
    await fs_1.promises.mkdir(opts.outParent, { recursive: true });
    const versionMapPath = path.join(opts.outParent, VERSION_MAP_FILE);
    const existing = await loadVersionMap(versionMapPath);
    const previousVersionDir = existing.length ? existing[existing.length - 1].versionDir : null;
    const now = new Date();
    const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
    const hashSeed = (0, sha1_1.hashContent)(Buffer.from(now.toISOString())).slice(0, 8);
    const versionName = `v${stamp}-${hashSeed}`;
    const versionDir = path.join(opts.outParent, versionName);
    await fs_1.promises.mkdir(versionDir, { recursive: true });
    return { versionDir, versionName, previousVersionDir };
}
async function updateVersionMap(opts, ensure, files) {
    const versionMapPath = path.join(opts.outParent, VERSION_MAP_FILE);
    const existing = await loadVersionMap(versionMapPath);
    const fileHashes = {};
    for (const f of files) {
        const data = await fs_1.promises.readFile(f);
        fileHashes[path.basename(f)] = (0, sha1_1.hashContent)(data);
    }
    const entry = {
        versionDir: ensure.versionName,
        baseComponent: opts.baseComponent,
        runTimestamp: new Date().toISOString(),
        previousVersionDir: ensure.previousVersionDir,
        fileHashes
    };
    existing.push(entry);
    await fs_1.promises.writeFile(versionMapPath, JSON.stringify(existing, null, 2));
    return existing;
}
async function loadVersionMap(p) {
    try {
        const txt = await fs_1.promises.readFile(p, 'utf8');
        return JSON.parse(txt);
    }
    catch {
        return [];
    }
}
function pad(n) {
    return n < 10 ? `0${n}` : `${n}`;
}
//# sourceMappingURL=versioning.js.map