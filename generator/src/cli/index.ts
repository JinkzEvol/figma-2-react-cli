#!/usr/bin/env node
import { Command } from 'commander';
import { runPipeline } from './run';
import * as path from 'path';
import { isModeSelectionValid, type ModeSelection } from '../connectivity/models/mode-selection';
import type { WarningEvent } from '../connectivity/models/warning-event';

function sanitizeToken(message: string, token: string | undefined): string {
  if (!token) return message;
  const trimmed = token.trim();
  if (!trimmed) return message;
  let sanitized = message;
  const variants = [trimmed, `Bearer ${trimmed}`];
  for (const variant of variants) {
    sanitized = sanitized.split(variant).join('[REDACTED_TOKEN]');
  }
  return sanitized;
}

function logWarnings(warnings: WarningEvent[] | undefined, token: string | undefined): void {
  if (!warnings || warnings.length === 0) return;
  warnings.forEach((warning) => {
    const sanitizedMessage = sanitizeToken(warning.message, token);
    const meta = warning.meta ? ` ${sanitizeToken(JSON.stringify(warning.meta), token)}` : '';
    console.log(`[${warning.code}] ${sanitizedMessage}${meta}`);
  });
}

function resolveModeSelection(opts: any): ModeSelection {
  const captureReplay = Boolean(opts.captureReplay);
  const replayFlag = typeof opts.replay === 'string' ? opts.replay : undefined;
  const resolvedReplayPath = replayFlag ? path.resolve(process.cwd(), replayFlag) : undefined;
  const selection: ModeSelection = {
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

export async function main(argv: string[] = process.argv): Promise<number> {
  const program = new Command();
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

  if (!isModeSelectionValid(selection)) {
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
  } as const;

  try {
    const result = await runPipeline(runOptions as any);
    logWarnings(result.warnings as WarningEvent[] | undefined, figmaToken);
    return result.exitCode;
  } catch (error) {
    console.error('Failed to execute generator:', error instanceof Error ? error.message : error);
    return 1;
  }
}

if (require.main === module) {
  main().then(code => process.exit(code));
}
