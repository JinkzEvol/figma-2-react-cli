# Quickstart — API Connectivity Layer

## Prerequisites
- Install generator dependencies: `npm install` inside `generator/`.
- Ensure `FIGMA_TOKEN` is exported when exercising live fetch paths.
- Install Powershell modules? (no new modules required).
- Run all commands from `E:\VS code projects\figma-2-react\generator` unless noted.

## Live Fetch Smoke Test
1. `Set-Location E:\VS code projects\figma-2-react\generator`.
2. Run the new connectivity suite: `npm run test:connectivity`.
3. Execute the CLI with live fetch flags against a synthetic fixture payload (see `tests/connectivity/__fixtures__/payloads/file-nodes-success.json`) or your own file:
   ```pwsh
   node dist/cli.js --file FAKEFILE --node 0:1 --out generated --variants --reuse-components --capture-replay
   ```
4. Expect exit code `0`, `summary.json` containing `"mode": "live"`, and `retryCount` equal to `0` for the stable fixture. The reference outputs under `tests/connectivity/__fixtures__/quickstart/live-run/` provide a known-good comparison.

## Replay Determinism Validation
1. Re-run the CLI with the `--replay <path>` option pointing at the captured bundle (for example `tests/connectivity/__fixtures__/quickstart/replay-run`).
2. Confirm the CLI prints `Replay mode active` (new log line) and exits with code `0`.
3. Compare output directories between live and replay runs: they must be byte-identical (see fixture parity validated by `tests/connectivity/replay-parity.spec.ts`).
4. Inspect `summary.json` and ensure `usedNetwork` is `false` and `replay.manifestHash` matches the live capture hash (`tests/connectivity/__fixtures__/quickstart/replay-run/summary.json` is the canonical example).

## Rate Limit Exhaustion Handling
1. Execute the CLI with the new test flag `--simulate-rate-limit` (added for deterministic testing) to force repeated 429 responses.
2. Expect retries spaced at 0.5s, 1s, 2s, 4s; total elapsed wait must be ≤ 7.5s.
3. The process should exit with code `6`, emit warning `API_RATE_LIMIT`, and not write component artifacts.

## Authorization Failure Handling
1. Temporarily unset `FIGMA_TOKEN` and run the CLI with `--file`/`--node` plus `--require-live-token` (test flag to force live path).
2. Expect exit code `1` for missing token. Repeat with an invalid token using `FIGMA_TOKEN=invalid` to exercise exit code `7` and verify the warning `API_AUTH_FAILURE` is surfaced.

## Replay Staleness Warning
1. Modify the replay artifact manifest to simulate an older capture (adjust `createdAt` to 15 days prior).
2. Run the CLI with `--replay` and confirm exit code `0`, summary warning `REPLAY_STALE`, and no network usage.

## Large Document Gate Override
1. Run the CLI with the fixture that reports 10,500 nodes and no override to confirm exit code `2` (large document gate).
2. Re-run with `--allow-large-file` and ensure a warning is emitted while processing continues successfully.

## Monitoring Summary Schema Stability
1. Validate the new summary schema by running `npm run test:summary-contracts`.
2. Confirm `summary.json` instances conform to `contracts/summary-extension.schema.json`.
