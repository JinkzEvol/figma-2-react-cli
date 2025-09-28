"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeReplayArtifact = writeReplayArtifact;
const node_fs_1 = require("node:fs");
const node_path_1 = __importDefault(require("node:path"));
const node_crypto_1 = __importDefault(require("node:crypto"));
const canonical_1 = require("../hashing/canonical");
function ensureIsoTimestamp(timestamp) {
    if (timestamp)
        return timestamp;
    return new Date().toISOString();
}
function safeSegmentName(id) {
    return id.replace(/[^a-zA-Z0-9_-]+/g, '-');
}
function formatDirName(createdAt, hash) {
    const compact = createdAt.replace(/[-:]/g, '').replace('T', '').replace('Z', '').slice(0, 12);
    const datePart = `${compact.slice(0, 8)}-${compact.slice(8, 12)}`;
    return `v${datePart}-${hash}`;
}
async function ensureDir(dir) {
    await node_fs_1.promises.mkdir(dir, { recursive: true });
}
async function writeReplayArtifact(options) {
    if (!options.segments || options.segments.length === 0) {
        throw new Error('Cannot persist replay artifact without captured segments');
    }
    const schemaVersion = options.schemaVersion ?? '1.0.0';
    const createdAt = ensureIsoTimestamp(options.session.capturedAt);
    const baseDir = node_path_1.default.resolve(options.baseDir);
    const preparedSegments = options.segments.map((segment, index) => {
        const bodyBuffer = Buffer.from(segment.response.body, 'utf8');
        const sha1 = node_crypto_1.default.createHash('sha1').update(bodyBuffer).digest('hex');
        const filename = `${index.toString().padStart(3, '0')}-${safeSegmentName(segment.id)}-${sha1.slice(0, 8)}.json`;
        const bodyPath = node_path_1.default.posix.join('responses', filename);
        const manifestSegment = {
            id: segment.id,
            request: segment.request,
            response: {
                status: segment.response.status,
                bodyPath,
                headers: segment.response.headers,
                recordedAt: segment.response.recordedAt
            },
            sha1,
            source: segment.source
        };
        return { manifestSegment, filename, bodyBuffer };
    });
    const manifestPayload = {
        schemaVersion,
        fileKey: options.fileKey,
        nodeId: options.nodeId,
        createdAt,
        generatorVersion: options.generatorVersion,
        hash: '',
        segments: preparedSegments.map((entry) => entry.manifestSegment),
        notes: null
    };
    const hashSource = (0, canonical_1.canonicalize)({
        schemaVersion: manifestPayload.schemaVersion,
        fileKey: manifestPayload.fileKey,
        nodeId: manifestPayload.nodeId,
        createdAt: manifestPayload.createdAt,
        generatorVersion: manifestPayload.generatorVersion,
        segments: manifestPayload.segments
    });
    const manifestHash = node_crypto_1.default.createHash('sha1').update(hashSource).digest('hex').slice(0, 8);
    manifestPayload.hash = manifestHash;
    const artifactDirName = formatDirName(createdAt, manifestHash);
    const artifactDir = node_path_1.default.join(baseDir, artifactDirName);
    const responsesDir = node_path_1.default.join(artifactDir, 'responses');
    await ensureDir(responsesDir);
    for (const entry of preparedSegments) {
        await node_fs_1.promises.writeFile(node_path_1.default.join(responsesDir, entry.filename), entry.bodyBuffer, 'utf8');
    }
    const manifestPath = node_path_1.default.join(artifactDir, 'manifest.json');
    await node_fs_1.promises.writeFile(manifestPath, JSON.stringify(manifestPayload, null, 2));
    const artifact = {
        manifest: manifestPayload,
        responsesDir,
        hash: manifestHash,
        createdAt,
        generatorVersion: options.generatorVersion,
        source: 'network'
    };
    const replayMetadata = {
        artifactPath: artifactDir,
        manifestHash,
        createdAt,
        ageDays: 0
    };
    return {
        artifact,
        manifestPath,
        replayMetadata
    };
}
//# sourceMappingURL=replay-writer.js.map