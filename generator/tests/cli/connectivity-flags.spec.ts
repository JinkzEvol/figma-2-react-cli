import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { SpyInstance } from 'jest-mock';
import type { RunResult } from '../../src/cli/run';
import { main } from '../../src/cli/index';
import { runPipeline } from '../../src/cli/run';

jest.mock('../../src/cli/run', () => ({
  runPipeline: jest.fn()
}));

const runPipelineMock = runPipeline as jest.MockedFunction<typeof runPipeline>;

describe('cli: connectivity flags', () => {
  const baseArgv = ['node', 'cli', '--file', 'FAKEFILE', '--node', '0:1'];
  let consoleErrorSpy: SpyInstance;
  let consoleLogSpy: SpyInstance;

  beforeEach(() => {
    jest.resetAllMocks();
    delete process.env.FIGMA_TOKEN;
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  it('rejects simultaneous --capture-replay and --replay usage', async () => {
    const exitCode = await main([...baseArgv, '--capture-replay', '--replay', 'artifact.json']);
    expect(exitCode).toBe(1);
    expect(runPipelineMock).not.toHaveBeenCalled();
    expect(consoleErrorSpy.mock.calls.flat().join(' ')).toContain('cannot use --capture-replay together with --replay');
  });

  it('requires a token when capture replay is requested', async () => {
    runPipelineMock.mockImplementation(async (options): Promise<RunResult> => {
      expect((options as any).captureReplay).toBe(true);
      expect((options as any).requireToken).toBe(true);
      return { exitCode: 1 };
    });

    const exitCode = await main([...baseArgv, '--capture-replay']);
    expect(exitCode).toBe(1);
    expect(consoleErrorSpy.mock.calls.flat().join(' ')).toContain('FIGMA_TOKEN');
  });

  it('propagates rate-limit exit code 6 from the pipeline', async () => {
    process.env.FIGMA_TOKEN = 'present';
    runPipelineMock.mockResolvedValue({ exitCode: 6 });

    const exitCode = await main([...baseArgv, '--capture-replay']);
    expect(exitCode).toBe(6);
    expect(runPipelineMock).toHaveBeenCalledWith(expect.objectContaining({ captureReplay: true } as Record<string, unknown>));
  });

  it('propagates authorization exit code 7 from the pipeline', async () => {
    process.env.FIGMA_TOKEN = 'present';
    runPipelineMock.mockResolvedValue({ exitCode: 7 });

    const exitCode = await main([...baseArgv, '--capture-replay']);
    expect(exitCode).toBe(7);
  });

  it('redacts raw token values from console output', async () => {
    process.env.FIGMA_TOKEN = 'super-secret-token';
    runPipelineMock.mockResolvedValue({
      exitCode: 6,
      warnings: [
        {
          code: 'API_RATE_LIMIT',
          message: 'Rate limited while using token super-secret-token'
        }
      ]
    });

    await main([...baseArgv, '--capture-replay']);

    const combinedOutput = `${consoleLogSpy.mock.calls.flat().join(' ')} ${consoleErrorSpy.mock.calls.flat().join(' ')}`;
    expect(combinedOutput.toLowerCase()).toContain('token');
    expect(combinedOutput).not.toContain('super-secret-token');
    expect(combinedOutput).toContain('API_RATE_LIMIT');
  });
});
