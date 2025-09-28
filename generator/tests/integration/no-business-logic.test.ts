import { describe, expect, it } from '@jest/globals';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { runPipeline } from '../../src/cli/run';

describe('integration: no business logic intrusion', () => {
  it('ensures emitted components omit handlers and stateful constructs', async () => {
    const outDir = path.resolve('generator/generated-no-logic');
    const result = await runPipeline({
      file: 'NOLOGIC',
      node: '0:1',
      out: outDir,
      variants: false,
      reuseComponents: false,
      overrideWarningThreshold: false,
      verboseTrace: false,
      disableHeadings: false
    });

    expect(result.exitCode).toBe(0);
    expect(result.summaryPath).toBeTruthy();
    if (!result.summaryPath) {
      throw new Error('summaryPath missing from run result');
    }

    const versionDir = path.dirname(result.summaryPath);
    const files = await fs.readdir(versionDir);
    const componentFile = files.find((f) => f.endsWith('.tsx'));
    expect(componentFile).toBeDefined();
    const componentSource = await fs.readFile(path.join(versionDir, componentFile!), 'utf8');

    const forbiddenPatterns = [/onClick=/, /useState\(/, /fetch\(/, /axios\./, /setTimeout\(/];
    for (const pattern of forbiddenPatterns) {
      expect(pattern.test(componentSource)).toBe(false);
    }
  });
});
