import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { runRetention } from '../../src/versioning/retention';

interface TestContext {
  root: string;
  cleanup: () => Promise<void>;
}

async function createTestRoot(names: string[]): Promise<TestContext> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'retention-test-'));
  for (const name of names) {
    const dir = path.join(root, name);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, 'placeholder.txt'), 'fixture', 'utf8');
  }
  return {
    root,
    cleanup: () => fs.rm(root, { recursive: true, force: true })
  };
}

async function exists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

const activeRoots: TestContext[] = [];

afterEach(async () => {
  await Promise.all(activeRoots.splice(0).map((ctx) => ctx.cleanup()));
});

describe('integration: retention helper', () => {
  it('performs a dry-run without deleting candidates', async () => {
    const ctx = await createTestRoot([
      'v20240101-1010-aaaaaaaa',
      'v20250301-1015-bbbbbbbb',
      'v20250320-0900-cccccccc'
    ]);
    activeRoots.push(ctx);

    const logger = { info: jest.fn(), warn: jest.fn() };
    const result = await runRetention({
      rootDir: ctx.root,
      keepLatest: 2,
      maxAgeDays: 60,
      now: new Date('2025-04-01T00:00:00Z'),
      logger
    });

    expect(result.deleted).toHaveLength(0);
    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0]).toContain('v20240101-1010-aaaaaaaa');
    expect(await exists(path.join(ctx.root, 'v20240101-1010-aaaaaaaa'))).toBe(true);
    expect(logger.info).toHaveBeenCalled();
  });

  it('rejects destructive runs without confirmation', async () => {
    const ctx = await createTestRoot([
      'v20240101-1010-aaaaaaaa',
      'v20250301-1015-bbbbbbbb',
      'v20250320-0900-cccccccc'
    ]);
    activeRoots.push(ctx);

    await expect(
      runRetention({
        rootDir: ctx.root,
        keepLatest: 1,
        maxAgeDays: 0,
        now: new Date('2025-04-01T00:00:00Z'),
        dryRun: false
      })
    ).rejects.toThrow(/--yes/);

    expect(await exists(path.join(ctx.root, 'v20240101-1010-aaaaaaaa'))).toBe(true);
  });

  it('deletes candidates when explicitly confirmed', async () => {
    const ctx = await createTestRoot([
      'v20240101-1010-aaaaaaaa',
      'v20250301-1015-bbbbbbbb',
      'v20250320-0900-cccccccc'
    ]);
    activeRoots.push(ctx);

    const result = await runRetention({
      rootDir: ctx.root,
      keepLatest: 1,
      maxAgeDays: 30,
      now: new Date('2025-04-20T00:00:00Z'),
      dryRun: false,
      confirm: true
    });

    expect(result.deleted).toHaveLength(2);
    expect(await exists(path.join(ctx.root, 'v20240101-1010-aaaaaaaa'))).toBe(false);
  expect(await exists(path.join(ctx.root, 'v20250301-1015-bbbbbbbb'))).toBe(false);
    expect(await exists(path.join(ctx.root, 'v20250320-0900-cccccccc'))).toBe(true);
  });
});
