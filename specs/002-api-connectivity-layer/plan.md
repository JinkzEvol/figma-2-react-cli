# Implementation Plan: API Connectivity Layer (Live Figma Fetch & Replay)

**Branch**: `002-api-connectivity-layer` | **Date**: 2025-09-28 | **Spec**: E:\VS code projects\figma-2-react\specs\002-api-connectivity-layer\spec.md
**Input**: Feature specification from `/specs/002-api-connectivity-layer/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path (done)
2. Fill Technical Context (done)
3. Fill the Constitution Check section (done)
4. Evaluate Constitution Check section (done)
5. Execute Phase 0 -> research.md (done)
6. Execute Phase 1 -> contracts, data-model.md, quickstart.md, agent context update (done)
7. Re-evaluate Constitution Check section (done)
8. Plan Phase 2 -> Describe task generation approach (tasks.md created below)
9. STOP - Ready for /tasks command
```

## Summary
- Introduce a connectivity orchestrator that performs live Figma fetches with deterministic exponential backoff, a 120s total timeout, and explicit exit codes for rate limit and authorization failures.
- Capture full-response snapshots into versioned replay artifacts that store canonical manifests and hashed payloads so offline runs reproduce component outputs byte-for-byte.
- Extend observability, warning management, and CLI validation to surface mode selection, warning thresholds, large document gates, and replay staleness while integrating cleanly with existing generator subsystems.

## Technical Context
**Language/Version**: TypeScript 5.5 targeting Node.js 20 LTS (generator/tsconfig)
**Primary Dependencies**: undici (HTTP client), commander (CLI parser), internal observability/versioning utilities
**Storage**: Local filesystem (`generator/generated-*`, new `generator/generated-replay/` bundles)
**Testing**: Jest 29 (unit, contract, integration and summary schema validation)
**Target Platform**: Node.js CLI invoked by developers and CI on Windows/Linux/macOS
**Project Type**: Single TypeScript CLI plus emitter library (no separate frontend/backend split)
**Performance Goals**: <= 15% overhead for capture vs static baseline; retry budget <= 7.5s; fetch phase completes within 120s; zero network usage during replay
**Constraints**: Deterministic hashing/no jitter; warning cap <= 5% unless override; large document threshold 10k nodes with override flag; never log PAT values; maintain <= 1px layout fidelity by isolating connectivity from transform logic
**Scale/Scope**: Figma documents up to 10k nodes with replay artifacts retained about 30 days for regression coverage

## Constitution Check
- Determinism Over Heuristics: Backoff uses fixed delays; manifests are canonicalized and hashed; replay loader short-circuits network calls to guarantee identical output.
- Fidelity Within One Pixel: Connectivity layer operates before traversal; transformations remain unchanged; large document overrides preserve safety warnings.
- Test-First & Contract Clarity: New JSON Schemas (`contracts/*.schema.json`) drive contract tests; CLI validation and replay integrity tests precede implementation.
- Transparent Observability & Traceability: Summary gains fetch metrics, mode, warnings; trace entries annotate `source` field; warning cap integration remains centralized.
- Minimalism & Incremental Complexity: Reuse existing `Warnings`, `TraceBuilder`, and `versioning` modules; new modules scoped to connectivity without introducing general abstractions.
- Explicit Versioned Idempotency: Replay artifacts use versioned directory naming and SHA-1 digests; component emission still flows through `ensureVersionDir`.

No constitutional violations identified; Complexity Tracking remains empty.

## Project Structure

### Documentation (this feature)
```
specs/002-api-connectivity-layer/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
`-- contracts/
    |-- replay-manifest.schema.json
    `-- summary-extension.schema.json
```
(Phase 2 produces `tasks.md` alongside these artifacts.)

### Source Code (repository root)
```
generator/
|-- src/
|   |-- cli/
|   |   |-- index.ts
|   |   `-- run.ts
|   |-- connectivity/           (new orchestrator module: live, replay, metrics)
|   |-- figma/
|   |   |-- client.ts
|   |   `-- prescan/
|   |-- observability/
|   |   |-- summary/
|   |   `-- trace/
|   |-- transform/
|   |-- versioning/
|   `-- responsive/
|-- tests/
|   |-- cli/
|   |-- connectivity/           (new suites for fetch/replay, exit codes, contracts)
|   `-- observability/
`-- generated-* (versioned outputs and replay bundles)
```

**Structure Decision**: Continue the single-repo TypeScript CLI architecture; add a `connectivity` domain folder to encapsulate fetch/replay orchestration while reusing existing observability, transform, and versioning surfaces.

## Phase 0: Outline & Research
- Investigated how to stage live fetch orchestration without polluting `runPipeline` and chose a dedicated `connectivity/session` module (see `research.md`).
- Defined deterministic retry plus timeout policy aligned with FR-004 and NFR-003.
- Selected replay artifact layout (`generator/generated-replay/`) to keep captures versioned and hashed.
- Determined summary/trace extensions and integrity guardrails, ensuring FR-016 and FR-024 can be met without touching transform logic.
- Outcome: Unknowns resolved; no NEEDS CLARIFICATION remain.

## Phase 1: Design & Contracts
- CLI & Mode Validation: Update `generator/src/cli/index.ts` to parse `--capture-replay`, `--replay <path>`, `--allow-large-file`, and reject conflicting selections before invoking `runPipeline`. Emit exit codes 6 (rate limit) and 7 (authorization) per FR-014/FR-015.
- Connectivity Module: Introduce `generator/src/connectivity/session.ts` that orchestrates live fetch (calling `FigmaClient`), accumulates metrics, enforces retry delays, respects the 120s cap, and optionally records segments to disk. Provide a parallel `replay/session.ts` loader that validates manifest integrity and rehydrates mocked responses.
- Figma Client Enhancements: Expand `figma/client.ts` with configurable retry schedule `[0.5, 1, 2, 4]` seconds, track elapsed time, classify retryable vs non-retryable HTTP codes, and expose structured results for the connectivity module.
- Replay Artifacts: Implement serializer in `generator/src/connectivity/replayWriter.ts` that writes `manifest.json`, `metadata.json`, and response payloads under hashed filenames; include SHA-1 validation and version stamping.
- Observability Extensions: Extend `Warnings`, `TraceBuilder`, and `buildSummary` to register new warning codes, write fetch metrics, log mode selection, and honor warning cap integration. Add schema validation tests driven by `contracts/summary-extension.schema.json`.
- Large Document Gate Integration: Use existing `preScan` output to emit `LARGE_FILE_NEAR_LIMIT` warnings when node count >= 9000 and block >10000 nodes unless `--allow-large-file` is true, ensuring summary plus exit code flows respect FR-008 and FR-022.
- Replay Integrity Checks: Validate manifest against `contracts/replay-manifest.schema.json`, recompute digests, warn on staleness (>14 days), and abort on mismatches without emitting partial artifacts.
- Testing Strategy: Author Jest suites covering live retry exhaustion, authorization exit, replay parity, schema validation, large document gating, token logging redaction (FR-021), and replay version skew warnings (FR-012).
- Agent Context: `.specify/scripts/powershell/update-agent-context.ps1 -AgentType copilot` executed (will rerun post-plan once final context values persist).

## Phase 2: Task Planning Approach
- Generate `tasks.md` enumerating CLI updates, connectivity module work, replay writer/loader implementation, warning/summary integration, schema validations, and new Jest suites. Tasks are ordered TDD-first: schema plus CLI validation tests, replay integrity tests, live fetch tests, then implementation, finishing with documentation updates.
- Parallelizable tasks ([P]) flag independent test/implementation pairs (for example manifest writer vs summary schema) once shared dependencies are ready.
- Expect about 26 tasks spanning CLI, connectivity, observability, and tests to satisfy FR/NFR coverage.

## Requirement Coverage Matrix
- Tracks alignment between functional requirements (FR-001–FR-028) and the Phase 3 task plan.
- Tests precede implementation per constitution; each FR lists at least one Jest suite and implementation task responsible for fulfillment.

| Requirement | Primary Tests | Implementation Tasks |
| --- | --- | --- |
| FR-001 | T006 | T022 |
| FR-002 | T006 | T022 |
| FR-003 | T006 | T022, T024 |
| FR-004 | T008, T011 | T024, T028 |
| FR-005 | T012 | T024, T028 |
| FR-006 | T008, T014 | T024, T029 |
| FR-007 | T007, T008 | T023, T024, T030 |
| FR-008 | T007 | T023 |
| FR-009 | T009 | T025 |
| FR-010 | T010 | T026 |
| FR-011 | T005, T009 | T026 |
| FR-012 | T009 | T026 |
| FR-013 | T010 | T026 |
| FR-014 | T006, T011 | T024, T028 |
| FR-015 | T006, T012 | T022, T024, T028 |
| FR-016 | T014 | T029, T030 |
| FR-017 | T011 | T023 |
| FR-018 | T014 | T029, T031 |
| FR-019 | T006 | T022 |
| FR-020 | T010 | T029 |
| FR-021 | T006 | T024 |
| FR-022 | T007 | T023 |
| FR-023 | T005, T009 | T025 |
| FR-024 | T009 | T026 |
| FR-025 | T006 | T022, T023 |
| FR-026 | T014 | T031 |
| FR-027 | T013 | T026 |
| FR-028 | T010 | T026 |

## Phase 3+: Future Implementation
- Phase 3: Execute tasks.md in priority order (tests before implementation).
- Phase 4: Implement connectivity layer, replay tooling, and CLI integration.
- Phase 5: Run Jest suites, replay parity checks, and quickstart scenarios before release.

## Complexity Tracking
| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|---------------------------------------|
| None | Plan fits within existing constitutional principles | N/A |

## Progress Tracking
**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented

---
*Based on Constitution v1.0.0 -- see `.specify/memory/constitution.md`*
