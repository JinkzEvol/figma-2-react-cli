# Feature Specification: API Connectivity Layer (Live Figma Fetch & Replay)

**Feature Branch**: `002-api-connectivity-layer`  
**Created**: 2025-09-27  
**Status**: Draft  
**Input**: User description: "API connectivity layer with real Figma fetch retries replay mode"

## Summary (Executive View)
Introduce a robust connectivity layer that lets users run the generator against live Figma documents while preserving determinism, safety, and auditability. The feature adds controlled network fetching, retry & backoff behavior, offline replay of previously captured responses, rate/volume safeguards, and clear user-surface outcomes (exit codes, warnings, summary metrics). Replay mode enables consistent regression testing and reproducible builds without requiring live network access every run.

## Goals
1. Allow authorized users to point the generator at a Figma File ID and produce artifacts from the current state of that file.
2. Provide deterministic outputs even when upstream data is fetched in real time (through canonicalization + snapshot capture + optional replay).
3. Protect users from excessive API usage (rate, quota, large document gating) with transparent warnings and abort signals.
4. Enable offline / CI runs via replaying a previously captured session (no network dependency once captured).
5. Expose clear, testable success & failure pathways (extended exit codes, warnings, metrics in summary/trace) to integrate with automation.

## Out of Scope (Explicit)
- UI components.
- Secrets management beyond existing environment variable usage.
- Streaming/partial progressive fetch output.
- Incremental diff-based refetching.

## Assumptions
- Figma PAT present in environment variable when live fetch requested.
- Transient errors represent <10% of total requests in typical usage.
- Deterministic hashing layer remains unchanged by this feature.

## Defaults Chosen (Former Clarifications)
| Topic | Default | Rationale |
|-------|---------|-----------|
| Max total fetch duration | 120s hard cap | Prevent hanging CI runs |
| Retry attempts | 4 (initial + 3 retries) | Matches clarified resilience policy |
| Retry backoff | Exponential 0.5s, 1s, 2s, 4s | Clarified balance of speed vs resilience |
| Max aggregate retry wait | 7.5s total delay | Sum of clarified backoff windows |
| Large document node threshold | 10,000 nodes | Reasonable upper bound for performance safety |
| Replay artifact retention guidance | 30 days | Keeps snapshots relevant while limiting storage bloat |
| Rate limit exhaustion exit code | 6 | Next available distinct code |
| Authorization failure exit code | 7 | Distinguish from missing token (1) |
| Replay staleness warning threshold | 14 days | Encourages periodic refresh |
| Acceptable capture overhead (NFR) | <= 15% vs baseline | Keeps performance predictable |

## Clarifications
### Session 2025-09-28
- Q: What maximum total fetch duration should we enforce before aborting a live run (drives timeout handling and user messaging)? -> A: 120s hard cap
- Q: Which retry/backoff policy should we standardize for transient errors (timeouts, 5xx, 429) to balance speed and resilience? -> A: Exponential 0.5s, 1s, 2s, 4s (4 attempts total)
- Q: What maximum file node count should trigger mandatory gating (abort unless override)? -> A: 10,000 nodes
- Q: What retention period should we adopt for replay artifacts before considered stale? -> A: 30 days
- Q: Are there any compliance or data-handling constraints we must enforce when storing raw Figma JSON in replay artifacts? -> A: No special constraints

## User Scenarios & Testing

### Primary User Story
As a developer running the design-to-code generator, I want to fetch the latest version of a Figma file safely and reproducibly so that I can generate up-to-date React components and later re-run the process offline with identical results using a captured replay.

### Acceptance Scenarios
1. Given a valid token and file ID, when the user runs the generator with live fetch enabled, then the system fetches the document, generates outputs, records a fetch summary, and exits with success (0) without warnings for a normal-sized file.
2. Given network instability causing transient failures, when the first N attempts fail but a later retry succeeds within policy, then the system completes successfully and includes a retry count metric (and warning only if thresholds exceeded).
3. Given the file exceeds a configured node threshold, when the user has not opted into large document processing, then the system aborts with the designated exit code and emits a clear warning explaining the gating condition.
4. Given a previously captured replay snapshot, when the user runs in replay mode without network access, then the system produces identical hashes and component outputs compared to the original live run and reports "replay=true" in summary metadata.
5. Given the API returns a non-retryable authorization error, when the fetch attempt occurs, then the system aborts immediately with a distinct exit code and a single authoritative warning (no retries performed).
6. Given the user supplies both live fetch and replay flags simultaneously, when execution begins, then the system rejects the run with a validation error instructing selection of exactly one mode.

### Edge Cases
- Token missing or empty: immediate failure with existing missing-token exit code (1); no partial artifacts persisted.
- Replay artifact corrupt or mismatched schema: run aborts with explicit integrity error; no fallback to live fetch.
- Mixed partial capture (missing segment): abort with integrity warning.
- Extreme file size just below limit (>=90% threshold): advisory warning issued.
- Rate limit (429) mid-run: retries scheduled per policy; on exhaustion exit code 6.
- Invalid/unauthorized token (401/403): immediate abort exit code 7.
- Replay artifact older than 14 days: staleness warning; still proceeds.

## Requirements

### Functional Requirements
- **FR-001**: System MUST allow specifying a target Figma File ID as an input parameter.
- **FR-002**: System MUST validate mutual exclusivity: exactly one of (live fetch, replay) MUST be selected when either is provided; default neither means legacy static mode.
- **FR-003**: System MUST detect absence of required token for live fetch and terminate with exit code 1.
- **FR-004**: System MUST perform up to 3 retries (4 total attempts) with exponential backoff delays of 0.5s, 1s, 2s, 4s on transient errors (timeouts, 5xx, 429) and abort the live fetch phase if cumulative elapsed fetch time exceeds 120s.
- **FR-005**: System MUST classify non-retryable errors (401,403, 4xx except 408/429) and abort immediately with exit code 7.
- **FR-006**: System MUST record in the execution summary: totalRequests, retryCount, fetchElapsedMs, mode ("live"|"replay"|"static").
- **FR-007**: System MUST emit a warning when retryCount > 0 or node count >= 90% of threshold (>=9,000 nodes).
- **FR-008**: System MUST abort with large document exit code (existing gating code) if node count > 10,000 and override not provided.
- **FR-009**: System MUST produce a deterministic replay artifact when --capture-replay flag is supplied in live mode.
- **FR-010**: System MUST allow --replay <path> to bypass all network calls.
- **FR-011**: System MUST validate replay manifest schema and internal hash integrity before use.
- **FR-012**: System MUST warn if replay artifact major generator version differs.
- **FR-013**: System MUST ensure identical hashes and emitted assets between live capture and subsequent replay using the same artifact.
- **FR-014**: System MUST use exit code 6 when rate limit (429) exhaustion occurs after all retries.
- **FR-015**: System MUST use exit code 7 for authorization failure (401/403) distinct from missing token (1).
- **FR-016**: System MUST include new API-related warnings in the existing warning cap enforcement.
- **FR-017**: System MUST suppress emission of partial outputs on fatal fetch or replay integrity failure.
- **FR-018**: System MUST log mode selection decision in summary and trace.
- **FR-019**: System MUST reject simultaneous --capture-replay and --replay usage before performing any network calls.
- **FR-020**: System MUST include boolean usedNetwork in summary (false for replay & static modes).
- **FR-021**: System MUST never log raw token value; only presence/absence.
- **FR-022**: System MUST allow --allow-large-file to override threshold, adding a safety warning.
- **FR-023**: System MUST embed a manifest (segments list, hash, createdAt, generatorVersion) within the replay artifact.
- **FR-024**: System MUST abort if recomputed manifest hash mismatches stored hash.
- **FR-025**: System MUST surface actionable guidance messages aligned to each exit path.
- **FR-026**: System MUST tag each trace fetch entry with source: "network" or "replay".
- **FR-027**: System MUST warn when replay artifact age > 14 days.
- **FR-028**: System MUST ensure replay mode does not alter canonical ordering/hashing logic.

### Non-Functional Requirements
- **NFR-001**: Live fetch + capture overhead MUST be <= 15% wall-clock vs baseline static mode for a medium file (5k nodes) measured across 3 consecutive runs.
- **NFR-002**: Replay mode MUST perform zero outbound network requests.
- **NFR-003**: Aggregate added wait from retries MUST be <= 7.5s based on the scheduled backoff windows.
- **NFR-004**: New summary fields MUST appear in all modes (with null or zero defaults where not applicable) to preserve schema stability.

### Key Entities
- **Fetch Session**: Run-scoped metrics and state for network interactions.
- **Replay Artifact**: Canonical snapshot bundle + manifest enabling offline deterministic reproduction.
- **Rate Limit Window**: Conceptual budget influencing retry vs abort.
- **Warning**: Structured advisory surfaced to user; may include codes for RETRY_USED, LARGE_FILE_NEAR_LIMIT, REPLAY_STALE.
- **Credential**: Presence-only indicator for secure token usage.

## Success Metrics
- 100% deterministic parity (hash & emitted artifacts) between capture and replay validation tests.
- < 5% runs impacted by rate limit exhaustion in normal usage scenarios.
- <= 15% overhead for capture vs static baseline in performance test harness.
- Zero leaked secrets in logs (verified via pattern scan test).

## Risks & Mitigations
- Rate limit churn -> bounded retries + explicit code 6.
- Replay drift with newer generator versions -> warning + encourage recapture.
- Large file performance degradation -> gating + override flag with warning.

## Review & Acceptance Checklist
### Content Quality
- [x] No implementation details beyond necessary behavioral semantics
- [x] Focused on user value and outcomes
- [x] Written accessibly
- [x] Mandatory sections completed

### Requirement Completeness
- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements testable & unambiguous
- [x] Success criteria measurable
- [x] Scope bounded
- [x] Dependencies & assumptions identified

## Execution Status (Tracking)
- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities resolved via defaults
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [x] Review checklist passed

## Next Steps
1. Approve this spec or request changes.
2. Generate implementation task plan mapping FR/NFR to engineering tasks.
3. Implement exit code additions (6,7) and summary/trace field extensions.
4. Introduce replay artifact schema & integrity tests.

**End of Specification**
