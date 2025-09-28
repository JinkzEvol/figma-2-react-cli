# API Connectivity Manual

This guide captures the hands-on steps for exercising the connectivity layer, persisting replay artifacts, and maintaining the generated bundles over time. Pair these notes with the quickstart document when onboarding new contributors or debugging CI issues.

## Environment Setup
- Install dependencies inside `generator/`:
  ```powershell
  cd "E:\VS code projects\figma-2-react\generator"
  npm install
  ```
- Export `FIGMA_TOKEN` before running live fetch scenarios. Replay workflows do **not** require the token.
- Use Node.js 20 LTS or newer; all scripts assume PowerShell on Windows, but the commands work cross-platform.

## Live Fetch Workflow
1. Run the connectivity test suites to verify contracts before issuing live calls:
   ```powershell
   npm run test:connectivity
   npm run test:summary-contracts
   ```
2. Execute the CLI against a file/node pair to fetch directly from Figma and optionally capture a replay bundle:
   ```powershell
   node dist/cli.js --file <FILE_KEY> --node <NODE_ID> --out generated --variants --reuse-components --capture-replay
   ```
3. Confirm the run exits with code `0` and inspect `summary.json` inside the newest `generated-*` directory:
   - `"mode": "live"`
   - `fetch.retryCount` reflects deterministic backoff (0 for stable fixtures).
   - `warnings` includes any rate-limit or large-document notices encountered during fetch.
4. When `--capture-replay` is used, a replay bundle is written to `generator/generated-replay/<version>/`. The manifest hash appears in `summary.replay.manifestHash`.

## Replay Workflow
1. Rerun the CLI using the captured bundle:
   ```powershell
   node dist/cli.js --file <FILE_KEY> --node <NODE_ID> --out generated --variants --reuse-components --replay "generator/generated-replay/<bundle>/manifest.json"
   ```
2. Verify `summary.json` reports `"mode": "replay"` and `usedNetwork` is `false`.
3. Component outputs from the live and replay runs should be byte-identical. The contract tests and `tests/connectivity/replay-parity.spec.ts` enforce this.
4. If the manifest is older than 14 days, the summary emits `REPLAY_STALE` while still exiting successfully.

## Retention & Cleanup
- Use the retention helper to prune older capture directories while keeping the most recent runs:
  ```powershell
  npm run build
  node dist/versioning/retention.js --root generator/generated-replay --keep 5
  ```
- For a dry run (default) the tool logs candidates without deleting. Add `--yes` to delete after review.
- CI environments should schedule retention to run weekly, keeping enough history for regression investigations (recommended: keep ≥3 captures per file).

## Troubleshooting
- **Exit code 6 (rate limit)**: Expect warnings `API_RATE_LIMIT` and `RETRY_USED`. Re-run once the retry budget cools or switch to replay mode.
- **Exit code 7 (auth failure)**: Token missing or invalid. Reset `FIGMA_TOKEN` and rerun. Contract tests `auth-failure.spec.ts` demonstrate expected output.
- **Large documents blocked**: When node count ≥ 10k the pipeline exits with code 2 unless `--allow-large-file` is supplied. Even with the override, `LARGE_FILE_NEAR_LIMIT` persists in the summary.
- **Replay integrity errors**: Manifest/hash mismatches raise `REPLAY_INTEGRITY` warnings and exit with code 6. Re-capture the replay bundle or inspect the modified files for corruption.
- **Performance budget breaches**: The connectivity layer must keep capture overhead ≤15% of the baseline fetch time. Run `npm test -- perf-budget` to ensure synthetic timing guards still pass.

## Reference Commands
- Validate connectivity suites: `npm run test:connectivity`
- Validate schema contracts: `npm run test:summary-contracts`
- Update agent context after significant structure changes: `.specify/scripts/powershell/update-agent-context.ps1 -AgentType copilot`
- Retention helper dry run: `node dist/versioning/retention.js --root generator/generated-replay --keep 5`

Maintain this manual alongside the quickstart to keep hands-on knowledge current as the connectivity feature evolves.
