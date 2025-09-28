import { describe, expect, it } from '@jest/globals';
import { createAjv, readSchema } from './schemaUtils';
import { runPipeline } from '../../src/cli/run';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('contract: trace schema', () => {
  const ajv = createAjv();

  it('validates emitted trace.json structure', async () => {
    const out = path.resolve('generated-contract-trace');
    const run = await runPipeline({ file: 'F', node: 'root', out, variants: false, reuseComponents: false, overrideWarningThreshold: false, verboseTrace: true, disableHeadings: false } as any);
    expect(run.exitCode).toBe(0);
    const entries = await fs.readdir(out);
    const versionDirs: string[] = [];
    for (const e of entries) {
      if (!e.startsWith('v')) continue;
      const stat = await fs.lstat(path.join(out, e));
      if (stat.isDirectory()) versionDirs.push(e);
    }
    versionDirs.sort();
    const traceDir = versionDirs[versionDirs.length - 1];
    const tracePath = path.join(out, traceDir, 'trace.json');
    const traceJson = JSON.parse(await fs.readFile(tracePath, 'utf8'));
    const schema = readSchema('trace.schema.json');
    const validate = ajv.compile(schema);
    const isValid = validate(traceJson);
    expect(isValid).toBe(true);
  });
});
