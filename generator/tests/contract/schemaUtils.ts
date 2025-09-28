import fs from 'node:fs';
import path from 'node:path';
import Ajv, { type Options as AjvOptions } from 'ajv';
import addFormats from 'ajv-formats';

function resolveFeatureDir(): string {
  if (process.env.FEATURE_DIR) {
    return path.resolve(process.env.FEATURE_DIR);
  }
  return path.resolve(__dirname, '../../..', 'specs', '001-deterministic-figma-to');
}

export function readSchema(schemaFile: string) {
  const featureDir = resolveFeatureDir();
  const contractsDir = path.join(featureDir, 'contracts');
  const targetPath = path.join(contractsDir, schemaFile);
  const schemaRaw = fs.readFileSync(targetPath, 'utf-8');
  return JSON.parse(schemaRaw);
}

export function createAjv(options: AjvOptions = {}) {
  const ajv = new Ajv({ allErrors: true, strict: false, ...options });
  addFormats(ajv);
  return ajv;
}
