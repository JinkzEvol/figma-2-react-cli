import { afterEach, describe, expect, it, jest } from '@jest/globals';
import os from 'node:os';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { runPipeline } from '../../src/cli/run';
import * as connectivity from '../../src/connectivity';

function createTempDir(prefix: string) {
  return fs.mkdtemp(path.join(os.tmpdir(), prefix));
}

describe('connectivity: performance budget', () => {
  const originalToken = process.env.FIGMA_TOKEN;
  let perfSpy: jest.SpiedFunction<typeof performance.now> | undefined;
  let currentTime = 0;

  const advance = (ms: number) => {
    currentTime += ms;
  };

  const clock: connectivity.MonotonicClock = {
    now: () => currentTime,
    sleep: async (ms: number) => {
      advance(ms);
    }
  };

  afterEach(() => {
    process.env.FIGMA_TOKEN = originalToken;
    if (perfSpy) {
      perfSpy.mockRestore();
      perfSpy = undefined;
    }
  });

  it('keeps capture overhead within 15 percent of baseline fetch timing', async () => {
    process.env.FIGMA_TOKEN = 'token-for-perf';

    const fixturePath = path.resolve(__dirname, '__fixtures__', 'payloads', 'file-nodes-success.json');
    const payload = JSON.parse(await fs.readFile(fixturePath, 'utf8'));

    const fetchStub = jest.fn(async () => {
      advance(80);
      return payload;
    });

    perfSpy = jest.spyOn(performance, 'now').mockImplementation(() => currentTime);

    const outBase = await createTempDir('generator-perf-base-');
    currentTime = 0;
    const baseResult = await runPipeline({
      file: 'FAKEFILE',
      node: '0:1',
      out: outBase,
      variants: false,
      reuseComponents: false,
      overrideWarningThreshold: false,
      verboseTrace: false,
      disableHeadings: false,
      connectivityClock: clock,
      connectivityClient: { fetchFileNodes: fetchStub },
      modeSelection: { live: true, replayPath: undefined, captureReplay: false, allowLargeFile: true, errors: [] },
      captureReplay: false
    } as any);

    const baseSummary = JSON.parse(await fs.readFile(baseResult.summaryPath!, 'utf8'));
    const baseFetch = baseSummary.timings.fetch;
    expect(baseFetch).toBeGreaterThan(0);

    const replayDir = await createTempDir('generator-perf-replay-');
    const realWrite = connectivity.writeReplayArtifact;
    const writeSpy = jest.spyOn(connectivity, 'writeReplayArtifact').mockImplementation(async (options) => {
      advance(10);
      return realWrite({ ...options, baseDir: replayDir });
    });

    currentTime = 0;
    fetchStub.mockClear();

    const captureResult = await runPipeline({
      file: 'FAKEFILE',
      node: '0:1',
      out: await createTempDir('generator-perf-capture-'),
      variants: false,
      reuseComponents: false,
      overrideWarningThreshold: false,
      verboseTrace: false,
      disableHeadings: false,
      connectivityClock: clock,
      connectivityClient: { fetchFileNodes: fetchStub },
      modeSelection: { live: true, replayPath: undefined, captureReplay: true, allowLargeFile: true, errors: [] },
      captureReplay: true,
      replayBaseDir: replayDir
    } as any);

    const captureSummary = JSON.parse(await fs.readFile(captureResult.summaryPath!, 'utf8'));
    const captureFetch = captureSummary.timings.fetch;

    writeSpy.mockRestore();

    const overheadRatio = (captureFetch - baseFetch) / baseFetch;
    expect(overheadRatio).toBeLessThanOrEqual(0.15);
  });
});
