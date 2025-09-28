import { describe, expect, it } from '@jest/globals';
import { createAjv, readSchema } from './schemaUtils';
import { runPipeline } from '../../src/cli/run';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('contract: version-map schema', () => {
  const ajv = createAjv();

  it('validates emitted version-map.json structure', async () => {
    const out = path.resolve('generated-contract-version-map');
    const r1 = await runPipeline({ file: 'F', node: 'root', out, variants: false, reuseComponents: false, overrideWarningThreshold: false, verboseTrace: false, disableHeadings: false } as any);
    const r2 = await runPipeline({ file: 'F', node: 'root', out, variants: false, reuseComponents: false, overrideWarningThreshold: false, verboseTrace: false, disableHeadings: false } as any);
    expect(r1.exitCode).toBe(0);
    expect(r2.exitCode).toBe(0);
    const mapPath = path.join(out, 'version-map.json');
    const versionMap = JSON.parse(await fs.readFile(mapPath, 'utf8'));
    expect(Array.isArray(versionMap)).toBe(true);
    const schema = readSchema('version-map.schema.json');
    const validate = ajv.compile(schema);
    for (const entry of versionMap) {
      const ok = validate(entry);
      if (!ok) {
        // console.log('Version map entry validation errors', validate.errors);
      }
      expect(ok).toBe(true);
    }
  });
});
