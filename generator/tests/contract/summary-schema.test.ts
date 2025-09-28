import { describe, expect, it } from '@jest/globals';
import { createAjv, readSchema } from './schemaUtils';
import { runPipeline } from '../../src/cli/run';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('contract: summary schema', () => {
  const ajv = createAjv();

  it('validates emitted summary.json structure', async () => {
    const out = path.resolve('generated-contract-summary');
    const run = await runPipeline({ file: 'F', node: 'root', out, variants: false, reuseComponents: false, overrideWarningThreshold: false, verboseTrace: false, disableHeadings: false } as any);
    expect(run.exitCode).toBe(0);
    const entries = await fs.readdir(out);
    const versionDirs: string[] = [];
    for (const e of entries) {
      if (!e.startsWith('v')) continue;
      const stat = await fs.lstat(path.join(out, e));
      if (stat.isDirectory()) versionDirs.push(e);
    }
    versionDirs.sort();
    expect(versionDirs.length).toBeGreaterThan(0);
    const summaryPath = path.join(out, versionDirs[versionDirs.length - 1], 'summary.json');
    const summaryJson = JSON.parse(await fs.readFile(summaryPath, 'utf8'));
    process.env.FEATURE_DIR = path.resolve(__dirname, '../../..', 'specs', '002-api-connectivity-layer');
    const schema = readSchema('summary.schema.json');
    const validate = ajv.compile(schema);
    const isValid = validate(summaryJson);
    if (!isValid) {
      // For debugging, surface first error
      // console.log(validate.errors);
    }
    expect(isValid).toBe(true);
  });
});
