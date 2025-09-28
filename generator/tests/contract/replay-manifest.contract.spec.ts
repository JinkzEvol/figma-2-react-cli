import { beforeAll, describe, expect, it } from '@jest/globals';
import type { ValidateFunction } from 'ajv';
import path from 'node:path';
import { createAjv, readSchema } from './schemaUtils';

describe('contract: replay-manifest schema', () => {
  const ajv = createAjv({ allErrors: true });
  let validate: ValidateFunction;

  beforeAll(() => {
    process.env.FEATURE_DIR = path.resolve(__dirname, '../../..', 'specs', '002-api-connectivity-layer');
    const schema = readSchema('replay-manifest.schema.json');
    validate = ajv.compile(schema);
  });

  it('accepts a valid replay manifest', () => {
    const manifest = {
      schemaVersion: '1.0.0',
      fileKey: 'ABCD1234',
      nodeId: '0:1',
      createdAt: '2025-09-27T21:26:00.000Z',
      generatorVersion: '0.1.0',
      hash: 'deadbeef',
      segments: [
        {
          id: 'GET-file-nodes',
          request: {
            method: 'GET',
            path: '/v1/files/ABCD1234/nodes',
            query: { ids: '0:1' },
            headers: { accept: 'application/json' }
          },
          response: {
            status: 200,
            bodyPath: 'responses/segment-0.json',
            headers: { 'content-type': 'application/json' },
            recordedAt: '2025-09-27T21:26:00.000Z'
          },
          sha1: '1234567890abcdef1234567890abcdef12345678',
          source: 'network'
        }
      ],
      notes: null
    };

    const isValid = validate(manifest);
    if (!isValid && validate.errors) {
      // eslint-disable-next-line no-console
      console.error(validate.errors[0]);
    }
    expect(isValid).toBe(true);
  });

  it('rejects manifests with missing required sha1 hashes', () => {
    const invalidManifest = {
      schemaVersion: '1.0.0',
      fileKey: 'ABCD1234',
      nodeId: '0:1',
      createdAt: '2025-09-27T21:26:00.000Z',
      generatorVersion: '0.1.0',
      hash: 'deadbeef',
      segments: [
        {
          id: 'GET-file',
          request: {
            method: 'GET',
            path: '/v1/files/ABCD1234',
            query: {},
            headers: { accept: 'application/json' }
          },
          response: {
            status: 200,
            bodyPath: 'responses/segment-0.json',
            headers: { 'content-type': 'application/json' },
            recordedAt: '2025-09-27T21:26:00.000Z'
          },
          source: 'network'
        }
      ]
    };

    const isValid = validate(invalidManifest);
    expect(isValid).toBe(false);
  });
});
