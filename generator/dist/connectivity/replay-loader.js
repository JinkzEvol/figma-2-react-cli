"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadReplayArtifact = loadReplayArtifact;
const node_fs_1 = require("node:fs");
const node_path_1 = __importDefault(require("node:path"));
const node_crypto_1 = __importDefault(require("node:crypto"));
const canonical_1 = require("../hashing/canonical");
function createWarning(code, message, meta) {
    return {
        code,
        message,
        meta: meta ?? null,
        layerRef: null,
        timestamp: new Date().toISOString()
    };
}
function daysBetween(now, then) {
    const diffMs = now.getTime() - then.getTime();
    return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}
function parseManifest(content) {
    const parsed = JSON.parse(content);
    return parsed;
}
function computeSha1(buffer) {
    return node_crypto_1.default.createHash('sha1').update(buffer).digest('hex');
}
async function loadReplayArtifact(options) {
    const warnings = [];
    const artifactDir = node_path_1.default.resolve(options.artifactPath);
    const manifestPath = node_path_1.default.join(artifactDir, 'manifest.json');
    const manifestRaw = await node_fs_1.promises.readFile(manifestPath, 'utf8');
    const manifest = parseManifest(manifestRaw);
    const createdAt = new Date(manifest.createdAt);
    const ageDays = daysBetween(options.now, createdAt);
    const segments = [];
    let integrityOk = true;
    const manifestHashSource = (0, canonical_1.canonicalize)({
        schemaVersion: manifest.schemaVersion,
        fileKey: manifest.fileKey,
        nodeId: manifest.nodeId,
        createdAt: manifest.createdAt,
        generatorVersion: manifest.generatorVersion,
        segments: manifest.segments
    });
    const computedManifestHash = node_crypto_1.default.createHash('sha1').update(manifestHashSource).digest('hex').slice(0, 8);
    const rawManifestHashSource = JSON.stringify({
        schemaVersion: manifest.schemaVersion,
        fileKey: manifest.fileKey,
        nodeId: manifest.nodeId,
        createdAt: manifest.createdAt,
        generatorVersion: manifest.generatorVersion,
        segments: manifest.segments
    });
    const alternateManifestHash = node_crypto_1.default
        .createHash('sha1')
        .update(rawManifestHashSource)
        .digest('hex')
        .slice(0, 8);
    const manifestHashValid = manifest.hash === computedManifestHash || manifest.hash === alternateManifestHash;
    if (!manifestHashValid) {
        integrityOk = false;
        warnings.push(createWarning('REPLAY_INTEGRITY', 'Replay manifest hash mismatch', {
            expected: manifest.hash,
            actual: computedManifestHash
        }));
    }
    for (const segment of manifest.segments) {
        const segmentPath = node_path_1.default.join(artifactDir, segment.response.bodyPath);
        const bodyBuffer = await node_fs_1.promises.readFile(segmentPath);
        const sha1 = computeSha1(bodyBuffer);
        if (sha1 !== segment.sha1) {
            integrityOk = false;
            warnings.push(createWarning('REPLAY_INTEGRITY', 'Replay payload hash mismatch', { expected: segment.sha1, actual: sha1, segment: segment.id }));
        }
        segments.push({
            id: segment.id,
            request: segment.request,
            response: {
                status: segment.response.status,
                headers: segment.response.headers,
                body: bodyBuffer.toString('utf8'),
                recordedAt: segment.response.recordedAt
            },
            source: 'replay'
        });
    }
    const expectedMajor = parseInt(options.expectedGeneratorVersion.split('.')[0] ?? '0', 10);
    const manifestMajor = parseInt(manifest.generatorVersion.split('.')[0] ?? '0', 10);
    if (!Number.isNaN(expectedMajor) && !Number.isNaN(manifestMajor) && expectedMajor !== manifestMajor) {
        warnings.push(createWarning('REPLAY_VERSION_SKEW', 'Replay artifact was captured with a different major generator version', {
            expected: options.expectedGeneratorVersion,
            found: manifest.generatorVersion
        }));
    }
    if (ageDays > 14) {
        warnings.push(createWarning('REPLAY_STALE', 'Replay artifact is older than 14 days', { ageDays }));
    }
    manifest.replayAgeDays = ageDays;
    const replayMetadata = {
        artifactPath: artifactDir,
        manifestHash: manifest.hash,
        createdAt: manifest.createdAt,
        ageDays
    };
    return {
        status: integrityOk ? 'success' : 'integrity-error',
        warnings,
        manifest,
        segments,
        replayMetadata
    };
}
//# sourceMappingURL=replay-loader.js.map