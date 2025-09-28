#!/usr/bin/env node
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
exports.main = main;
const commander_1 = require("commander");
const run_1 = require("./run");
const path = __importStar(require("path"));
const mode_selection_1 = require("../connectivity/models/mode-selection");
function sanitizeToken(message, token) {
    if (!token)
        return message;
    const trimmed = token.trim();
    if (!trimmed)
        return message;
    let sanitized = message;
    const variants = [trimmed, `Bearer ${trimmed}`];
    for (const variant of variants) {
        sanitized = sanitized.split(variant).join('[REDACTED_TOKEN]');
    }
    return sanitized;
}
function logWarnings(warnings, token) {
    if (!warnings || warnings.length === 0)
        return;
    warnings.forEach((warning) => {
        const sanitizedMessage = sanitizeToken(warning.message, token);
        const meta = warning.meta ? ` ${sanitizeToken(JSON.stringify(warning.meta), token)}` : '';
        console.log(`[${warning.code}] ${sanitizedMessage}${meta}`);
    });
}
function resolveModeSelection(opts) {
    const captureReplay = Boolean(opts.captureReplay);
    const replayFlag = typeof opts.replay === 'string' ? opts.replay : undefined;
    const resolvedReplayPath = replayFlag ? path.resolve(process.cwd(), replayFlag) : undefined;
    const selection = {
        live: !resolvedReplayPath,
        replayPath: resolvedReplayPath,
        captureReplay,
        allowLargeFile: Boolean(opts.allowLargeFile),
        errors: []
    };
    if (captureReplay && resolvedReplayPath) {
        selection.errors.push('cannot use --capture-replay together with --replay');
    }
    if (opts.replay === '') {
        selection.errors.push('value for --replay must be a non-empty path');
    }
    if (resolvedReplayPath) {
        selection.live = false;
    }
    return selection;
}
async function main(argv = process.argv) {
    const program = new commander_1.Command();
    program
        .name('figma-gen')
        .description('Deterministic Figma → React generator')
        .requiredOption('--file <fileKey>', 'Figma file key')
        .requiredOption('--node <nodeId>', 'Root node id')
        .option('--out <dir>', 'Output parent directory', 'generated')
        .option('--variants', 'Enable responsive variants', false)
        .option('--reuse-components', 'Enable component reuse detection', true)
        .option('--ignore-warning-threshold', 'Bypass warning cap failure', false)
        .option('--verbose-trace', 'Write verbose trace.json', false)
        .option('--disable-headings', 'Disable heading inference', false)
        .option('--node-count-threshold <n>', 'Large doc node count threshold', (v) => parseInt(v, 10))
        .option('--depth-threshold <n>', 'Large doc depth threshold', (v) => parseInt(v, 10))
        .option('--capture-replay', 'Capture live network responses for replay mode reuse', false)
        .option('--replay <artifactPath>', 'Run generator using a previously captured replay artifact')
        .option('--allow-large-file', 'Override large document gating guardrail', false)
        .parse(argv);
    const opts = program.opts();
    const selection = resolveModeSelection(opts);
    if (!(0, mode_selection_1.isModeSelectionValid)(selection)) {
        selection.errors.forEach((err) => console.error(err));
        return 1;
    }
    const figmaToken = process.env.FIGMA_TOKEN;
    if (selection.captureReplay && !figmaToken) {
        console.error('FIGMA_TOKEN is required when using --capture-replay to persist replay artifacts.');
    }
    const runOptions = {
        file: opts.file,
        node: opts.node,
        out: path.resolve(process.cwd(), opts.out),
        variants: Boolean(opts.variants),
        reuseComponents: Boolean(opts.reuseComponents),
        overrideWarningThreshold: Boolean(opts.ignoreWarningThreshold),
        verboseTrace: Boolean(opts.verboseTrace),
        disableHeadings: Boolean(opts.disableHeadings),
        nodeCountThreshold: opts.nodeCountThreshold,
        depthThreshold: opts.depthThreshold,
        captureReplay: selection.captureReplay,
        replayPath: selection.replayPath,
        allowLargeFile: selection.allowLargeFile,
        requireToken: selection.captureReplay,
        modeSelection: selection
    };
    try {
        const result = await (0, run_1.runPipeline)(runOptions);
        logWarnings(result.warnings, figmaToken);
        return result.exitCode;
    }
    catch (error) {
        console.error('Failed to execute generator:', error instanceof Error ? error.message : error);
        return 1;
    }
}
if (require.main === module) {
    main().then(code => process.exit(code));
}
//# sourceMappingURL=index.js.map