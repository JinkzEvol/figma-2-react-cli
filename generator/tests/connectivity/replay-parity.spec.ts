import { describe, expect, it, jest } from '@jest/globals';
import * as fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { runPipeline } from '../../src/cli/run';
import { ensureVersionDir } from '../../src/versioning';
import { copyFixtureDir } from './fixture-utils';

jest.mock('../../src/cli/run');
jest.mock('../../src/versioning');

const runPipelineMock = runPipeline as jest.MockedFunction<typeof runPipeline>;
const ensureVersionDirMock = ensureVersionDir as jest.MockedFunction<typeof ensureVersionDir>;

describe('connectivity: replay parity', () => {
  it('ensures replay artifacts reproduce live outputs and sets usedNetwork=false', async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'f2r-quickstart-'));
    try {
      const liveDir = path.join(tempRoot, 'live-run');
      const replayDir = path.join(tempRoot, 'replay-run');

      await copyFixtureDir(path.join('quickstart', 'live-run'), liveDir);
      await copyFixtureDir(path.join('quickstart', 'replay-run'), replayDir);

      ensureVersionDirMock.mockResolvedValue({ versionDir: liveDir, versionName: 'v20250927-2126-ac1b2dff' } as any);

      runPipelineMock.mockResolvedValueOnce({
        exitCode: 0,
        summaryPath: path.join(liveDir, 'summary.json')
      });

      runPipelineMock.mockResolvedValueOnce({
        exitCode: 0,
        summaryPath: path.join(replayDir, 'summary.json')
      });
      ensureVersionDirMock.mockResolvedValueOnce({ versionDir: replayDir, versionName: 'v20250928-1010-baadf00d' } as any);

      const liveSummary = JSON.parse(await fs.readFile(path.join(liveDir, 'summary.json'), 'utf8'));
      const replaySummary = JSON.parse(await fs.readFile(path.join(replayDir, 'summary.json'), 'utf8'));

      expect(liveSummary.mode).toBe('live');
      expect(replaySummary.mode).toBe('replay');
      expect(replaySummary.usedNetwork).toBe(false);
      expect(liveSummary.hash).toBe(replaySummary.hash);

      const liveComponent = await fs.readFile(path.join(liveDir, 'GeneratedHero.v1.tsx'), 'utf8');
      const replayComponent = await fs.readFile(path.join(replayDir, 'GeneratedHero.v1.tsx'), 'utf8');
      expect(replayComponent).toBe(liveComponent);
    } finally {
      await fs.rm(tempRoot, { recursive: true, force: true });
    }
  });
});
