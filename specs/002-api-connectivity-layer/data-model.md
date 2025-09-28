# Data Model — API Connectivity Layer

## Entity: FetchSession
- **Description**: Represents a single execution of the generator’s live fetch pipeline including network requests, retry policy, and derived metrics persisted into the summary.
- **Fields**:
  - `fileKey: string` — target Figma file identifier provided by the user (FR-001).
  - `entryNodeId: string` — node used to scope traversal (FR-001).
  - `mode: "live" | "replay" | "static"` — canonical execution mode persisted in summaries (FR-018).
  - `usedNetwork: boolean` — indicates whether outbound requests were made (FR-020).
  - `totalRequests: number` — count of network calls (FR-006).
  - `retryCount: number` — number of retries performed across all requests (FR-006, FR-007).
  - `fetchElapsedMs: number` — total wall-clock time for fetch-related activity (FR-006, FR-004).
  - `retryBudgetMs: number` — aggregate wait time spent in backoff; must be ≤ 7500ms (NFR-003).
  - `termination: "success" | "timeout" | "rate-limit" | "auth" | "integrity"` — final reason for stopping fetch.
  - `exitCode: number` — exit code propagated to CLI (FR-014, FR-015).
  - `warnings: WarningEvent[]` — warnings emitted during fetch/replay validation (FR-007, FR-016).
  - `capturedAt?: string` — ISO timestamp when replay capture occurred (FR-023).
  - `replayArtifactPath?: string` — absolute path to captured replay for deterministic re-use (FR-009).
- **Relationships**:
  - Has one optional `ReplayArtifact` when capture is enabled.
  - Writes to `SummaryEnvelope.fetch` for persistence.

## Entity: ReplayArtifact
- **Description**: On-disk bundle storing captured responses and integrity metadata for offline replay.
- **Fields**:
  - `manifest: ReplayManifest` — declarative summary of contents (FR-023).
  - `responsesDir: string` — directory path holding canonicalized payload segments (FR-009).
  - `hash: string` — truncated SHA-1 computed over ordered manifest data (FR-024).
  - `createdAt: string` — ISO timestamp when artifact was captured (FR-023).
  - `generatorVersion: string` — semantic version extracted from package metadata (FR-023, FR-027).
  - `source: "network"` — marks that the data originated from live fetch.
- **Relationships**:
  - Contains many `ReplaySegment` records.
  - Referenced by `FetchSession.replayArtifactPath` and `SummaryEnvelope.replay`.

## Entity: ReplayManifest
- **Description**: Canonical manifest persisted alongside replay data for validation prior to offline runs.
- **Fields**:
  - `fileKey: string` — Figma file ID used during capture (FR-009).
  - `nodeId: string` — entry node (FR-009).
  - `segments: ReplaySegment[]` — ordered list of captured responses (FR-023).
  - `hash: string` — deterministic digest covering manifest structure (FR-024).
  - `createdAt: string` — ISO timestamp (FR-023).
  - `generatorVersion: string` — major.minor.patch of generator (FR-012).
  - `schemaVersion: string` — versioned schema identifier for backward compatibility.
  - `replayAgeDays: number` — derived at load time to trigger stale warnings (FR-027).
- **Relationships**:
  - Owned by a single `ReplayArtifact`.
  - Validated by `ReplayIntegrityCheck` routine before `FetchSession.mode` transitions to `replay` (FR-011).

## Entity: ReplaySegment
- **Description**: Atomic recorded network payload used to reconstruct API responses during replay mode.
- **Fields**:
  - `id: string` — deterministic identifier derived from request path + query params (FR-023).
  - `request: {
      method: string;
      path: string;
      query: Record<string, string>;
      headers: Record<string, string>;
    }` — canonicalized request envelope (FR-010, FR-026).
  - `response: {
      status: number;
      bodyPath: string;
      headers: Record<string, string>;
      recordedAt: string;
    }` — captured response metadata with disk location of payload (FR-009).
  - `sha1: string` — digest of response body ensuring integrity (FR-024).
  - `source: "network" | "replay"` — indicates origin for trace tagging (FR-026).
- **Relationships**:
  - Many segments belong to a `ReplayManifest`.
  - Used by `TraceBuilder` to annotate entries with `source` metadata (FR-026).

## Entity: WarningEvent
- **Description**: Structured warning record emitted during fetch or replay validation.
- **Fields**:
  - `code: "RETRY_USED" | "LARGE_FILE_NEAR_LIMIT" | "REPLAY_STALE" | "API_AUTH_FAILURE" | "API_RATE_LIMIT" | "REPLAY_INTEGRITY" | string` — machine-readable code (FR-007, FR-027).
  - `message: string` — user-facing description including actionable guidance (FR-025).
  - `layerRef?: string` — optional node identifier when tied to traversal.
  - `meta?: Record<string, unknown>` — structured supplemental info (retry counts, age days, threshold).
  - `timestamp: string` — ISO timestamp for observability timeline.
- **Relationships**:
  - Aggregated by `Warnings` manager and written into summary + trace (FR-016, FR-018).

## Entity: SummaryEnvelope
- **Description**: Extended summary document persisted for each run with new connectivity fields.
- **Fields**:
  - `versionDir: string` — versioned output directory (existing behaviour).
  - `mode: "live" | "replay" | "static"` — echoed from `FetchSession.mode` (FR-018).
  - `usedNetwork: boolean` — indicates network usage (FR-020).
  - `fetch`: {
      `totalRequests: number;`
      `retryCount: number;`
      `fetchElapsedMs: number;`
      `retryBudgetMs: number;`
      `timeouts: number;`
      `rateLimitCount: number;`
      `authorizationFailures: number;`
      `overrideNotice?: string;`
    } — aggregated metrics (FR-006, FR-014, FR-015).
  - `warnings: WarningEvent[]` — existing field populated with new codes (FR-016).
  - `replay?: {
      `artifactPath: string;`
      `manifestHash: string;`
      `createdAt: string;`
      `ageDays: number;`
    }` — replay metadata (FR-009, FR-023, FR-027).
  - `timings` — existing timings record extended to include `fetch` span (FR-006).
- **Relationships**:
  - Generated by `buildSummary` and validated against `contracts/summary-extension.schema.json` (FR-006, FR-016).

## Entity: ModeSelection
- **Description**: CLI-level validation result ensuring exactly one of live fetch or replay is active unless both omitted.
- **Fields**:
  - `live: boolean` — true when live fetch requested (FR-002).
  - `replayPath?: string` — provided path when replay mode selected (FR-010).
  - `captureReplay: boolean` — true when user wants to persist replay artifact (FR-009).
  - `allowLargeFile: boolean` — override flag permitting >10k nodes (FR-022).
  - `errors: string[]` — validation errors encountered (FR-002, FR-019).
- **Relationships**:
  - Consumed by CLI parser before invoking `runPipeline` to determine exit path.
