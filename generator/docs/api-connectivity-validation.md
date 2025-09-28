# API Connectivity Validation Log

_Date_: 2025-09-28
_Environment_: Windows 10 • Node.js 20 LTS • `npm run build` artifacts available

## Executed Scenarios

| Step | Command | Result |
| --- | --- | --- |
| 1 | `npm run test:connectivity` | ✅ Passed — 7 suites, 10 tests (covers live fetch retries, replay parity, staleness, auth & rate limit exits, perf budget) |
| 2 | `npm run test:summary-contracts` | ✅ Passed — 2 suites, 4 tests (summary extension + replay manifest schemas) |

## Observations
- Jest emits a `ts-jest` warning about configuring the transformer under `transform` instead of `globals`; the warning is unchanged from previous runs.
- The performance budget guard (`tests/connectivity/perf-budget.spec.ts`) now runs as part of the connectivity suite and reports success.
- No snapshot updates were required; replay contract fixtures remain current.

## Next Actions
- Optional: run `node dist/cli.js --file <FILE_KEY> --node <NODE_ID> --capture-replay` against a real document for smoke-testing live fetch on hardware.
- Schedule the retention helper (`node dist/versioning/retention.js --root generator/generated-replay --keep 5`) weekly to keep capture history within storage limits.
