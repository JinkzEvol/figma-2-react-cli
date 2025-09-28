import { describe, expect, it } from '@jest/globals';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { runPipeline } from '../../src/cli/run';

describe('integration: verbose trace flag', () => {
  it('writes extended trace entries including source metadata when enabled', async () => {
    const outDir = path.resolve('generator/generated-verbose-trace');
    const result = await runPipeline({
      file: 'TRACE',
      node: '0:1',
      out: outDir,
      variants: false,
      reuseComponents: false,
      overrideWarningThreshold: false,
      verboseTrace: true,
      disableHeadings: false
    });

    expect(result.exitCode).toBe(0);
    expect(result.tracePath).toBeTruthy();
    if (!result.tracePath) {
      throw new Error('tracePath missing when verboseTrace enabled');
    }

    const traceEntries = JSON.parse(await fs.readFile(result.tracePath, 'utf8'));
    expect(Array.isArray(traceEntries)).toBe(true);
    const fetchEntry = traceEntries.find((entry: any) => entry.type === 'FETCH');
    expect(fetchEntry).toBeDefined();
    expect(fetchEntry.source).toBeDefined();
    expect(fetchEntry.actions.some((action: string) => action.startsWith('source='))).toBe(true);
  });
});
