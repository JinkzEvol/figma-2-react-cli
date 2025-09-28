import { beforeAll, describe, expect, it } from '@jest/globals';
import type { ValidateFunction } from 'ajv';
import path from 'node:path';
import { createAjv, readSchema } from './schemaUtils';

describe('contract: summary-extension schema', () => {
  const ajv = createAjv({ allErrors: true });
  let validate: ValidateFunction;

  beforeAll(() => {
    process.env.FEATURE_DIR = path.resolve(__dirname, '../../..', 'specs', '002-api-connectivity-layer');
    const schema = readSchema('summary-extension.schema.json');
    validate = ajv.compile(schema);
  });

  it('accepts a valid connectivity summary payload', () => {
    const sampleSummary = {
      versionDir: 'v20250927-2126-ac1b2dff',
      mode: 'live',
      usedNetwork: true,
      fetch: {
        totalRequests: 4,
        retryCount: 1,
        fetchElapsedMs: 1245,
        retryBudgetMs: 3500,
        timeouts: 0,
        rateLimitCount: 0,
        authorizationFailures: 0,
        overrideNotice: null
      },
      replay: {
        artifactPath: 'E:/captures/replay/v20250927-2126-ac1b2dff',
        manifestHash: '1a2b3c4d',
        createdAt: '2025-09-27T21:26:00.000Z',
        ageDays: 3
      },
      warnings: [
        { code: 'RETRY_USED', message: 'Issued retry after transient error', layerRef: null, meta: { retries: 1 } },
        { code: 'REPLAY_STALE', message: 'Replay artifact older than 14 days', meta: null }
      ],
      timings: {
        fetch: 1245,
        total: 3120
      },
      overrideNotice: null,
      warningCap: {
        threshold: 0.05,
        override: false
      }
    };

    const isValid = validate(sampleSummary);
    if (!isValid && validate.errors) {
      // Surface the first validation error to aid debugging when this test fails during implementation.
      // eslint-disable-next-line no-console
      console.error(validate.errors[0]);
    }
    expect(isValid).toBe(true);
  });

  it('rejects summaries with retry budget above 7.5s', () => {
    const invalidSummary = {
      versionDir: 'v20250927-2126-ac1b2dff',
      mode: 'live',
      usedNetwork: true,
      fetch: {
        totalRequests: 2,
        retryCount: 1,
        fetchElapsedMs: 9000,
        retryBudgetMs: 8000,
        timeouts: 0,
        rateLimitCount: 0,
        authorizationFailures: 0
      },
      warnings: [],
      timings: {
        fetch: 9000
      }
    };

    const isValid = validate(invalidSummary);
    expect(isValid).toBe(false);
  });
});
