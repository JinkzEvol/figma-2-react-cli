import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { SpyInstance } from 'jest-mock';
import { main } from '../../src/cli/index';
import { runPipeline } from '../../src/cli/run';

jest.mock('../../src/cli/run', () => ({
  runPipeline: jest.fn()
}));

const runPipelineMock = runPipeline as jest.MockedFunction<typeof runPipeline>;

describe('cli: large document gating', () => {
  const baseArgv = ['node', 'cli', '--file', 'FAKEFILE', '--node', '0:1'];
  let consoleErrorSpy: SpyInstance;
  let consoleLogSpy: SpyInstance;

  beforeEach(() => {
    jest.resetAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  it('surfaces LARGE_FILE_NEAR_LIMIT warnings when runPipeline aborts due to size', async () => {
    const warnings = [
      { code: 'LARGE_FILE_NEAR_LIMIT', message: 'Node count at 9,300 of 10,000 threshold' },
      { code: 'API_RATE_LIMIT', message: 'Simulated secondary warning' }
    ];
    runPipelineMock.mockResolvedValue({ exitCode: 2, warnings });

    const exitCode = await main(baseArgv);

    expect(exitCode).toBe(2);
    const loggedOutput = `${consoleLogSpy.mock.calls.flat().join(' ')} ${consoleErrorSpy.mock.calls.flat().join(' ')}`;
    expect(loggedOutput).toContain('LARGE_FILE_NEAR_LIMIT');
    expect(runPipelineMock).toHaveBeenCalledWith(expect.objectContaining({ allowLargeFile: false } as Record<string, unknown>));
  });

  it('forwards --allow-large-file flag to runPipeline', async () => {
    runPipelineMock.mockResolvedValue({ exitCode: 0, warnings: [] });

    const exitCode = await main([...baseArgv, '--allow-large-file']);

    expect(exitCode).toBe(0);
    expect(runPipelineMock).toHaveBeenCalledWith(expect.objectContaining({ allowLargeFile: true } as Record<string, unknown>));
  });
});
