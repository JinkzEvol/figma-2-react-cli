
# Implementation Plan: Deterministic Figma → Next.js React Tailwind Conversion Tool

**Branch**: `001-deterministic-figma-to` | **Date**: 2025-09-27 | **Spec**: specs/001-deterministic-figma-to/spec.md
**Input**: Feature specification from `E:/VS code projects/figma-2-react/specs/001-deterministic-figma-to/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from file system structure or context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Fill the Constitution Check section based on the content of the constitution document.
4. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, `GEMINI.md` for Gemini CLI, `QWEN.md` for Qwen Code or `AGENTS.md` for opencode).
7. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
Convert a selected Figma frame/component (and optionally responsive variants) into deterministic, pixel‑fidelity React (Next.js) components styled with Tailwind utilities, exporting required assets with stable hashed names and producing comprehensive logs (summary + per-node trace). Determinism, 1px fidelity gate, warning threshold (5%), adaptive large-document gating, versioned outputs, and observability are core guarantees.

## Technical Context
**Language/Version**: TypeScript (Next.js 14+ / React 18)  
**Primary Dependencies**: Next.js, React, Tailwind CSS, Figma REST API (HTTP fetch), Node.js crypto (SHA-1)  
**Storage**: Local filesystem outputs only (versioned directories + assets)  
**Testing**: Jest (unit + integration), custom contract tests (JSON report schema), snapshot tests for deterministic outputs  
**Target Platform**: Node.js runtime (CLI) + Next.js app consumption  
**Project Type**: single (frontend-oriented generator tooling within repository)  
**Performance Goals**: <5s typical frame (≤800 nodes), large docs require confirmation above 3000 nodes / depth >12  
**Constraints**: Deterministic hashing (SHA-1 truncated 8), 1px layout tolerance, warning threshold (cap) 5% (override flag `--ignore-warning-threshold`)  
**Scale/Scope**: Typical frame ≤800 nodes (fast path), large frame adaptive gating up to ~3000+ nodes

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle / Gate | Compliance Status | Notes |
|------------------|-------------------|-------|
| Determinism Over Heuristics | Planned ✔ | Stable ordering, hashing, no randomness. |
| Fidelity Within One Pixel | Planned ✔ | FR-034 + test diff harness. |
| Test-First & Contract Clarity | Planned ✔ | Contract tests for JSON summary + layout check before impl. |
| Transparent Observability | Planned ✔ | Structured JSON + per-node trace file. |
| Minimalism & Incremental Complexity | Planned ✔ | Start direct Tailwind utilities, add abstractions only after duplication proof. |
| Explicit Versioned Idempotency | Planned ✔ | Version directory + .vN file suffix scheme. |
| Warning Threshold Gate (5%) | Planned ✔ | Enforced in run pipeline; override flag documented. |
| Large Document Gate (3000 / 12) | Planned ✔ | Pre-scan module. |
| Hash Stability Canonicalization | Planned ✔ | Canonical serializer for hash input. |
| Dependency Policy Justification | Planned ✔ | No extra libs yet beyond core; any addition will include complexity table entry. |
| Performance Target <5s typical | Planned ✔ | Timing instrumentation + warning path. |

All gates satisfied in design phase (no deviations). Proceed to Phase 0.

## Project Structure

### Documentation (this feature)
```
specs/[###-feature]/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
generator/
├── src/
│   ├── cli/               # CLI entry & argument parsing
│   ├── figma/             # Figma API client + DTO normalization
│   ├── transform/         # Layer -> intermediate model transforms
│   ├── layout/            # Auto layout & absolute positioning mapping
│   ├── hashing/           # Canonical serialization + SHA-1 logic
│   ├── assets/            # Export + naming
│   ├── emit/              # React/Tailwind code emission
│   ├── responsive/        # Variant detection & merge
│   ├── versioning/        # Version directory + mapping log
│   ├── observability/     # Logging, trace, summary build
│   └── config/            # Thresholds, flags, overrides
└── tests/
      ├── unit/
      ├── integration/
      ├── contract/          # JSON report schema, fidelity, warning cap tests
      └── fixtures/          # Sample Figma JSON fixtures
```

**Structure Decision**: Single in‑repo generator package (`generator/`) with clear domain submodules; separates concerns enabling focused tests and deterministic ordering. No additional backend/frontend split required.

### Snapshot Determinism Scope
Deterministic snapshot set explicitly includes:
1. Component TSX file contents (excluding version directory name path segment).
2. `summary.json` (excluding runtime timestamps which are not stored) – must include counts, warning threshold (cap), override flags, variantConflicts.
3. `trace.json` ordering of entries.
4. Asset filenames list (not file binary content) – stable across identical runs.
5. `version-map.json` content except for appended new version records by subsequent runs.

## Phase 0: Outline & Research
Focus: Confirm best practices for (a) Figma API rate limits & partial fetch optimization, (b) canonical serialization for hashing (ordering, float precision), (c) layout diff testing strategy (render vs. computed style extraction), (d) performance instrumentation granularity, (e) responsive variant detection edge cases.

Research Tasks:
1. Figma API selective fetch approach (file nodes endpoint vs full file) → minimize payload.
2. Canonical JSON serialization rules: stable key sort, numeric rounding precision (proposed: 4 decimal places) for hash input.
3. Evaluate React testing strategy for layout fidelity: JSDOM vs. headless browser (decide if headless needed for accurate layout).
4. Performance timing instrumentation boundaries (fetch, transform, emit, write).
5. Responsive variant suffix parsing patterns and conflict detection.

Deliverable (`research.md`): For each task capture Decision, Rationale, Alternatives.

## Phase 1: Design & Contracts
Prerequisite: `research.md` finalized.

Artifacts:
1. `data-model.md`: Define entities (DesignSource, Layer, ComponentDefinition, Asset, Warning, ExportSummary, VersionRecord) with fields + validation notes.
2. `contracts/`:
   - `summary.schema.json` (JSON Schema for export summary)
   - `trace.schema.json` (per-node trace entry array schema)
   - `version-map.schema.json` (link versions) 
3. Contract Tests (initial failing):
   - Ensure summary JSON validates against schema.
   - Ensure warning cap logic test fails before implementation.
   - Ensure fidelity diff test fails until layout comparator exists.
   - Ensure hash stability test (two identical fixture runs) expects identical asset names (fails initially).
4. `quickstart.md`: CLI usage, environment variables (FIGMA_TOKEN), sample command, explanation of version directory + `.vN` suffix.
5. Agent context update (post-artifact generation) via required script.

Constitution Re-check: After artifacts, verify gates; log any deviations in Complexity table (expected none).

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `.specify/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart)
- Each contract → contract test task [P]
- Each entity → model creation task [P] 
- Each user story → integration test task
- Implementation tasks to make tests pass

**Ordering Strategy**:
- TDD order: Tests before implementation 
- Dependency order: Models before services before UI
- Mark [P] for parallel execution (independent files)

**Estimated Output**: 25-30 numbered, ordered tasks in tasks.md

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |


## Progress Tracking
**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [ ] Phase 1: Design complete (/plan command will generate)
- [ ] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [ ] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [ ] Complexity deviations documented (none so far)

---
*Based on Constitution v1.0.0 - See `/memory/constitution.md`*

## Additional Clarifications Added Post-Tasks Analysis
- Variant breakpoint ordering MUST follow Tailwind ascending order (base→sm→md→lg→xl→2xl).
- Exit Codes (initial proposal): 0 success; 1 missing token; 2 large document aborted; 3 fidelity failure; 4 warning threshold exceeded; 5 other error.
- Version directory pattern standardized: `vYYYYMMDD-HHMM-<8charHash>`.
