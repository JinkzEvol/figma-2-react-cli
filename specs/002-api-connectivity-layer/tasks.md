# Tasks: API Connectivity Layer (Live Figma Fetch & Replay)

**Input**: Design documents from `E:\VS code projects\figma-2-react\specs\002-api-connectivity-layer`
**Prerequisites**: plan.md, research.md, data-model.md, contracts/, quickstart.md

## Phase 3.1: Setup
- [X] T001 Update `generator/package.json` to add `test:connectivity` and `test:summary-contracts` npm scripts so quickstart commands run the new Jest suites.
- [X] T002 [P] Adjust `generator/jest.config.cjs` to include `tests/connectivity/**/*.spec.ts` and new CLI test globs, keeping coverage paths deterministic.
- [X] T003 [P] Append `generator/generated-replay/` to the root `.gitignore` and document retention expectations in the existing comment block.

## Phase 3.2: Tests First (TDD) - write these Jest specs and watch them fail before any implementation
- [X] T004 [P] Create `generator/tests/contract/summary-extension.contract.spec.ts` validating `contracts/summary-extension.schema.json` against positive/negative samples.
- [X] T005 [P] Create `generator/tests/contract/replay-manifest.contract.spec.ts` validating `contracts/replay-manifest.schema.json` and hash enforcement edge cases.
- [X] T006 [P] Add `generator/tests/cli/connectivity-flags.spec.ts` covering mutually exclusive `--capture-replay`/`--replay`, missing token exit 1, rate limit exit 6, auth exit 7, and asserting log output redacts tokens per FR-021.
- [X] T007 [P] Add `generator/tests/cli/large-document-gate.spec.ts` verifying `--allow-large-file` behavior and `LARGE_FILE_NEAR_LIMIT` warning propagation.
- [X] T008 [P] Add `generator/tests/connectivity/live-fetch-session.spec.ts` asserting deterministic retry schedule (0.5/1/2/4s), 120s cap, and summary metrics (`totalRequests`, `retryCount`).
- [X] T009 [P] Add `generator/tests/connectivity/replay-integrity.spec.ts` ensuring manifest schema validation, hash mismatch aborts, warning `REPLAY_INTEGRITY`, and emitting a major-version skew warning per FR-012.
- [X] T010 [P] Add `generator/tests/connectivity/replay-parity.spec.ts` comparing live capture vs replay outputs for byte-identical artifacts and summary `usedNetwork=false`.
- [X] T011 [P] Add `generator/tests/connectivity/rate-limit.spec.ts` simulating repeated 429s to assert exit code 6, capped backoff <= 7.5s, and no emitted components.
- [X] T012 [P] Add `generator/tests/connectivity/auth-failure.spec.ts` covering 401/403 responses to assert exit code 7 and single `API_AUTH_FAILURE` warning.
- [X] T013 [P] Add `generator/tests/connectivity/replay-staleness.spec.ts` flagging artifacts older than 14 days with `REPLAY_STALE` warning yet successful exit.
- [X] T014 [P] Add `generator/tests/integration/summary-connectivity.spec.ts` verifying warning cap enforcement, override reporting, and trace `source` tagging.

## Phase 3.3: Data Models (one file per entity, safe to parallel once tests exist)
- [X] T015 [P] Implement `generator/src/connectivity/models/fetch-session.ts` defining `FetchSessionState` per data-model.md.
- [X] T016 [P] Implement `generator/src/connectivity/models/replay-artifact.ts` capturing artifact metadata and relationships.
- [X] T017 [P] Implement `generator/src/connectivity/models/replay-manifest.ts` with schemaVersion, segments, and staleness helpers.
- [X] T018 [P] Implement `generator/src/connectivity/models/replay-segment.ts` detailing request/response envelopes and SHA-1 tracking.
- [X] T019 [P] Implement `generator/src/connectivity/models/warning-event.ts` enumerating new warning codes and metadata helpers.
- [X] T020 [P] Implement `generator/src/connectivity/models/summary-envelope.ts` reflecting extended summary structure and fetch metrics.
- [X] T021 [P] Implement `generator/src/connectivity/models/mode-selection.ts` modeling CLI mode validation outcomes.

## Phase 3.4: Core Implementation (execute after T004-T021 are in place)
- [X] T022 Update `generator/src/cli/index.ts` to parse new flags, enforce exclusivity, surface guidance errors, and set exit code mapping.
- [X] T023 Update `generator/src/cli/run.ts` to delegate to connectivity session/replay loader, gate large documents with override, and prevent partial artifact writes on fetch failure.
- [X] T024 Implement `generator/src/connectivity/session.ts` orchestrating live fetch retries, timeout enforcement, metrics aggregation, optional capture recording hooks, and ensuring no instrumentation logs raw tokens (FR-021).
- [X] T025 Implement `generator/src/connectivity/replay-writer.ts` persisting captures (`manifest.json`, payloads) under `generator/generated-replay/` with deterministic naming and SHA-1 hashes.
- [X] T026 Implement `generator/src/connectivity/replay-loader.ts` validating manifests, verifying hashes, computing age warnings, returning in-memory payloads for replay mode, and emitting major-version skew warnings per FR-012.
- [X] T027 Add `generator/src/connectivity/index.ts` exporting session APIs, manifest utilities, and a monotonic delay helper reused by tests.
- [X] T028 Update `generator/src/figma/client.ts` to accept deterministic retry schedule, classify retryable codes, and report structured errors for connectivity session.
- [X] T029 Extend `generator/src/observability/summary.ts` to include mode, usedNetwork, fetch metrics, replay block, and override fields while keeping warning cap logic intact.
- [X] T030 Extend `generator/src/observability/warnings.ts` with new warning codes (`RETRY_USED`, `LARGE_FILE_NEAR_LIMIT`, `REPLAY_STALE`, `API_RATE_LIMIT`, `API_AUTH_FAILURE`, `REPLAY_INTEGRITY`).
- [X] T031 Update `generator/src/observability/trace.ts` to tag fetch entries with `source` ("network"|"replay") and record retry events.
- [X] T032 Update `generator/src/observability/index.ts` (and related barrel exports) so new summary and warning helpers are consumable by the pipeline.

## Phase 3.5: Integration & Tooling
- [X] T033 Wire connectivity session into quickstart fixtures by adding reusable mock payloads under `generator/tests/connectivity/__fixtures__/` and updating tests to consume them.
- [X] T034 Update `generator/README.md` to document new CLI flags, exit codes 6/7, and the replay capture workflow.
- [X] T035 Update `specs/002-api-connectivity-layer/quickstart.md` with finalized script names (`npm run test:connectivity`, `npm run test:summary-contracts`) and fixture locations.

## Phase 3.6: Polish
- [X] T036 [P] Add focused unit tests in `generator/tests/unit/warnings-connectivity.spec.ts` covering new warning helper behaviors.
- [X] T037 [P] Add performance regression guard in `generator/tests/connectivity/perf-budget.spec.ts` asserting capture overhead 15% using synthetic timers.
- [X] T038 [P] Create `generator/docs/api-connectivity-manual.md` summarizing manual run steps, retention guidance, and troubleshooting tips.
- [X] T039 [P] Run quickstart scenarios sequentially, capturing results in `generator/docs/api-connectivity-validation.md` for release notes.

## Dependencies
- T004-T014 must complete (and fail) before starting any implementation task T015-T032.
- Data model tasks T015-T021 unblock connectivity implementation tasks T024-T027.
- CLI updates (T022) must precede run pipeline integration (T023) and summary wiring (T029-T032).
- Observability tasks T029-T032 depend on new models (T019-T021) and connectivity session outputs (T024-T026).
- Documentation tasks T034-T039 run only after functional work (T022-T033) succeeds.

## Parallel Execution Examples
```pwsh
# Kick off independent contract and CLI test scaffolds together once setup is done
Task.run --ids T004,T005,T006

# After tests exist, generate parallel model files
Task.run --ids T015,T016,T017,T018,T019,T020,T021

# Polish tasks can also run concurrently late in the cycle
Task.run --ids T036,T037,T038,T039
```
