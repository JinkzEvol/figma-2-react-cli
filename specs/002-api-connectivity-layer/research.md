# Phase 0 Research — API Connectivity Layer

## Live Fetch Integration Strategy
- **Decision**: Wrap all remote Figma interactions in a new `figma/session` orchestrator that calls the existing `FigmaClient` and exposes `runLiveFetch({ fileKey, nodeId, captureReplay? })` for the pipeline.
- **Rationale**: Centralizing live fetch behavior lets `runPipeline` request a single entry point without leaking retry logic or manifest bookkeeping, and we can inject either the network client or a replay loader behind the same interface.
- **Alternatives considered**: Extending `runPipeline` directly with fetch loops was rejected because it would mix IO control flow with transformation logic and make replay switching harder to test.

## Retry & Timeout Policy
- **Decision**: Implement deterministic exponential backoff delays (0.5s, 1s, 2s, 4s) plus jitter-free scheduling and track cumulative wall-clock time with `performance.now()` to enforce the 120s abort cap.
- **Rationale**: Deterministic, jitter-free intervals satisfy the constitution’s determinism requirement and align with the spec defaults while keeping behavior predictable across test runs.
- **Alternatives considered**: Using randomized jitter or `undici` retry helpers was rejected because they introduce nondeterministic wait times and make capture/replay parity brittle.

## Replay Artifact Layout
- **Decision**: Persist replay captures under `generator/generated-replay/` using `<timestamp>-<fileKey>-<hash>` directories that store `manifest.json`, `responses/file.json`, and `metadata.json` with SHA-1 digests for each segment.
- **Rationale**: Reusing the generator’s versioned-directory conventions keeps parity with existing history retention, makes cleanup tooling consistent, and keeps per-run data isolated.
- **Alternatives considered**: Embedding replay payloads alongside generated components was rejected to avoid polluting the component version map and to prevent accidental commits of large JSON blobs.

## Summary & Trace Extensions
- **Decision**: Extend `observability/summary` to include `mode`, `usedNetwork`, `totalRequests`, `retryCount`, `fetchElapsedMs`, and integrate new warning codes (`RETRY_USED`, `LARGE_FILE_NEAR_LIMIT`, `REPLAY_STALE`).
- **Rationale**: Centralizing summary updates where the existing warning cap is enforced minimizes risk of forgetting to log fields and ensures schema contracts remain deterministic.
- **Alternatives considered**: Writing ad-hoc logs in `runPipeline` was rejected because it fragments observability and would require duplicating warning cap integration.

## Integrity & Security Controls
- **Decision**: Compute SHA-1 over canonicalized JSON payloads and store only token-presence metadata, never the raw PAT, to satisfy FR-021 and replay integrity gates.
- **Rationale**: Canonical hashing matches existing artifact hashing, and avoiding token storage keeps the replay artifact safe to check into version control for regression tests.
- **Alternatives considered**: Using SHA-256 was considered but unnecessary given the existing eight-character SHA-1 truncation convention and would add conversion overhead without additional value.
