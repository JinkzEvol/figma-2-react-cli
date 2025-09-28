# Tasks: Deterministic Figma → Next.js React Tailwind Conversion Tool

**Input**: Design documents from `specs/001-deterministic-figma-to/`
**Prerequisites**: plan.md (complete), research.md, data-model.md, contracts/, quickstart.md

## Execution Flow (main)
See plan → This file enumerates executable tasks (TDD first). Each task is atomic, references concrete file paths, and is unambiguous.

## Legend
`[P]` = Can run in parallel (distinct files, no ordering dependency)

## Phase 3.1: Setup
- [X] T001 Initialize generator package: create `generator/package.json` with TypeScript, Jest, Tailwind peer dependency, scripts (build, test).
- [X] T002 Configure TypeScript: add `generator/tsconfig.json` (ES2022 target, strict true, outDir `dist`).
- [X] T003 [P] Add eslint + prettier config files under `generator/` (basic recommended rules) and npm scripts.
- [X] T004 Establish directory skeleton under `generator/src/` (cli, figma, transform, layout, hashing, assets, emit, responsive, versioning, observability, config) with placeholder index files.
- [X] T005 Add Jest config `generator/jest.config.cjs` with ts-jest, set testMatch for `tests/**/*.test.ts`.
- [X] T006 [P] Install dev dependencies (typescript, ts-node, ts-jest, @types/node, jest, eslint, prettier) & runtime deps (undici, commander) in package.json (omit kleur per minimalism principle).
- [X] T007 Create Tailwind config integration note (no runtime generation needed) in `generator/README.md` referencing quickstart.
 - [ ] T007a (Optional Alternative) Add justification for any future CLI color dependency (≥40 LOC reduction) in plan Complexity Tracking if such dependency is introduced.

## Phase 3.2: Tests First (Contract & Integration) – MUST FAIL INITIALLY
- [X] T008 Create contract schema validation helper `generator/tests/contract/schemaUtils.ts` to load JSON schemas.
- [X] T009 [P] Contract test summary schema `generator/tests/contract/summary-schema.test.ts` (expect sample stub to fail until emitter implemented).
- [X] T010 [P] Contract test trace schema `generator/tests/contract/trace-schema.test.ts` (placeholder failing test referencing empty output path).
- [X] T011 [P] Contract test version map schema `generator/tests/contract/version-map-schema.test.ts`.
- [X] T012 Integration test warning cap logic `generator/tests/integration/warning-cap.test.ts` (simulate >5% warnings triggers fail state without override; TODO markers for real runner).
- [X] T013 Integration test fidelity diff `generator/tests/integration/fidelity.test.ts` (placeholder comparing fake computed geometry vs expected to force fail now).
- [X] T014 Integration test hash stability `generator/tests/integration/hash-stability.test.ts` (simulate two identical fixture runs expecting identical asset names; fails until hashing implemented).
- [X] T015 Integration test variant merge `generator/tests/integration/variant-merge.test.ts` (stub ensuring responsive merging yields expected variant set; failing initially; will later assert ordering base→2xl and conflict exclusion).
- [X] T016 Integration test override flag audit `generator/tests/integration/override-flag.test.ts` (ensure override sets overrideUsed & overrideNotice, exit code unaffected, flagged summary).
- [X] T017 Determinism ordering test `generator/tests/integration/determinism-order.test.ts` (two identical runs produce identical component TSX, summary.json, trace.json ordering, asset filenames).
- [X] T018 Large document gate test `generator/tests/integration/large-doc-gate.test.ts` (simulate >threshold pre-scan decline→ no outputs; accept→ outputs + largeDocument true).
- [X] T019 Depth limit test `generator/tests/integration/depth-limit.test.ts` (fixture exceeding depth 25 produces DEPTH_LIMIT_REACHED warning and truncates deeper nodes).
- [X] T020 Version map linkage test `generator/tests/integration/version-map-linkage.test.ts` (second run links previous versionDir and increments component file .vN).

## Phase 3.3: Core Implementation (Only After Tests In Place)
### Hashing & Canonicalization
 - [X] T021 Implement canonical serializer `generator/src/hashing/canonical.ts` (stable key sort, 4dp rounding, whitespace norm) + unit tests (basic tests only; edge cases later in T056).
 - [X] T022 [P] Implement hash utility `generator/src/hashing/sha1.ts` (export `hashContent(input: string|Buffer): string` returning 8-char prefix).

### Figma Fetch & Pre-Scan
 - [X] T023 Implement Figma API client `generator/src/figma/client.ts` (files/:key/nodes selective fetch) with token injection.
 - [X] T024 Implement pre-scan module `generator/src/figma/prescan.ts` (estimate nodeCount/depth from partial JSON, compare thresholds, return gating decision).
 - [X] T025 [P] Add rate-limit handling + basic retry (429) in client.

### Transformation Pipeline
 - [X] T026 Define intermediate models `generator/src/transform/models.ts` (Layer, ComponentDefinition, Asset skeleton interfaces mirrored from data-model.md fields).
 - [X] T027 Implement traversal + layer extraction `generator/src/transform/traverse.ts` (respect `_ignore`, build structure, depth limit warnings).
 - [X] T028 Implement auto layout mapping `generator/src/layout/autoLayout.ts` (direction, gap, alignment -> Tailwind classes) with unit tests.
 - [X] T029 [P] Implement absolute positioning mapper `generator/src/layout/absolute.ts` (fallback for non-auto layout nodes).
 - [X] T030 Implement typography + style mapping `generator/src/transform/typography.ts` (font, size, line-height, weight, color to Tailwind / arbitrary).
 - [X] T031 [P] Implement color token resolver `generator/src/transform/colors.ts` (palette mapping + fallback arbitrary class logging; summary logs fallback count).
 - [X] T032 Implement multi-style text splitter `generator/src/transform/textSplit.ts`.
 - [X] T033 Implement component reuse detection `generator/src/transform/reuse.ts` (group repeated named components; maintain mapping table).

### Assets
- [X] T034 Implement asset export logic `generator/src/assets/export.ts` (image/SVG retrieval, filename `name--hash.ext`, collision strategy) including stub Figma image endpoint logic (mock for now).
- [X] T035 [P] Implement asset hashing integration test updates (adjust failing tests to real helper once ready).
- [X] T036 Asset collision test `generator/tests/integration/asset-collision.test.ts` (force simulated duplicate base name scenarios). 

### Responsive Variants
 - [X] T037 Implement variant parser `generator/src/responsive/variants.ts` (regex + width classification) + conflict warning generation.
 - [X] T038 [P] Implement variant merger `generator/src/responsive/merge.ts` producing breakpoint conditional wrapper structure.
 - [X] T039 Variant ordering & conflict test `generator/tests/integration/variant-ordering.test.ts` (assert base→2xl ordering and variantConflicts logging).

### Emission & Versioning
 - [X] T040 Implement JSX/Tailwind emitter `generator/src/emit/componentEmitter.ts` (stateless functional components, deterministic class ordering: layout→spacing→color→typography→other).
 - [X] T041 Implement version directory manager `generator/src/versioning/versioning.ts` (create `vYYYYMMDD-HHMM-<8charHash>` + compute component `.vN` suffix, update version map JSON).
 - [X] T042 [P] Implement mapping log writer `generator/src/versioning/mappingLog.ts` linking versions & file hashes.
 - [X] T043 Version increment test `generator/tests/integration/version-increment.test.ts` (multiple runs increment .vN correctly).

### Observability & Summary
 - [X] T044 Implement per-node trace builder `generator/src/observability/trace.ts` (ordered append, skip ignored but record ignored flag; stable ordering test in T017).
 - [X] T045 Implement summary builder `generator/src/observability/summary.ts` (warning threshold (cap) evaluation, timings aggregation, variant listing, variantConflicts, overrideNotice).
 - [X] T046 [P] Implement performance timing utility `generator/src/observability/timings.ts` (phase timers API, timings keys fetch|preScan|transform|assets|emit|write|total).
 - [X] T047 Implement warning system `generator/src/observability/warnings.ts` (codes, push/list with categories).
 - [X] T048 Performance warning test `generator/tests/integration/performance-warning.test.ts` (simulate >5s triggers warning field).

### CLI Integration
 - [X] T049 Implement CLI argument parser `generator/src/cli/index.ts` (commander), wiring flags: file, node, out, reuse-components, variants, ignore-warning-threshold, disable-headings, thresholds.
 - [X] T050 Hook pipeline in CLI `generator/src/cli/run.ts` (sequence: fetch→prescan→traverse→transform→assets→variants→emit→version→summary/log write) returning documented exit codes.
 - [X] T051 [P] Add verbose trace flag handling & file writes for summary.json, trace.json, version-map.json.
 - [X] T052 CLI exit code mapping test `generator/tests/integration/cli-exit-codes.test.ts`.

### Fidelity & Determinism Validation
 - [X] T053 Implement layout diff comparator `generator/src/layout/diff.ts` (accept expected vs produced geometry map, compute deltas, fail if >1px, drives exit code 3 on failure).
 - [X] T054 [P] Implement hash stability test harness `generator/tests/integration/hash-stability.test.ts` update to run pipeline with fixture after emitter exists (remove TODO markers).
 - [X] T055 Hash canonicalization edge test `generator/tests/unit/hashing-canonicalization.test.ts`.

## Phase 3.4: Integration
- [X] T056 Integrate font embedding/fallback logic `generator/src/transform/fonts.ts` (attempt retrieval, fallback stack, substitution warnings).
- [X] T057 Integrate override flag effect in summary (set overrideUsed + overrideNotice) inside summary builder.
- [X] T058 [P] Implement large document confirmation hook (environment or interactive stub) `generator/src/cli/confirmLargeDoc.ts`.
- [X] T059 Implement depth limit enforcement & DEPTH_LIMIT_REACHED code emission (connect traverse + warnings module).
- [X] T060 Font fallback test `generator/tests/integration/font-fallback.test.ts`.
- [X] T061 Large doc abort test (decline path) `generator/tests/integration/prescan-abort.test.ts` (ensures no files emitted on decline).
- [X] T062 Depth limit enforcement test (additional assertions) `generator/tests/integration/depth-limit-extended.test.ts`.

## Phase 3.5: Polish
 - [X] T063 [P] Add unit tests for canonical serializer edge cases `generator/tests/unit/canonical.test.ts`.
 - [X] T064 [P] Add unit tests for auto layout mapping `generator/tests/unit/autoLayout.test.ts`.
 - [X] T065 [P] Add unit tests for variant parser `generator/tests/unit/variants.test.ts`.
 - [X] T066 Documentation: Expand `generator/README.md` with module overview & examples.
 - [X] T067 Add script to cleanup old versions (retention helper dry-run) `generator/src/versioning/retention.ts` + doc reference.
 - [X] T068 Performance test harness `generator/tests/integration/perf.test.ts` (skip by default, reports timings; warns if typical frame >5s simulated).
 - [X] T069 Final snapshot tests for emitted component ordering `generator/tests/integration/snapshot-emission.test.ts`.
 - [X] T070 Update agent context file via `.specify/scripts/powershell/update-agent-context.ps1 -AgentType copilot` after core modules exist.
 - [X] T071 Retention helper dry-run safety test `generator/tests/integration/retention-helper.test.ts` (dry-run no deletions; execute path requires --yes flag).
 - [X] T072 Color fallback logging test `generator/tests/integration/color-fallback.test.ts`.
 - [X] T073 No business logic intrusion test `generator/tests/integration/no-business-logic.test.ts` (scan emitted code for disallowed handlers).
 - [X] T074 Verbose trace flag test `generator/tests/integration/verbose-trace.test.ts` (ensures additional trace fields present when flag set).
 - [X] T075 Asset collision forced scenario test (extended) `generator/tests/integration/asset-collision-extended.test.ts`.

## Added / Updated Parallel Execution Examples
Example (new early extended contract set):
```
Run in parallel: T016 T017 T018 T019 T020
```
Example (observability + performance):
```
Run in parallel: T044 T046 T047
```

## Parallel Execution Examples
Example 1 (early contract tests):
```
Run in parallel: T009 T010 T011
```
Example 2 (hashing stage after tests):
```
Run in parallel: T016 T017
```
Example 3 (observability utilities):
```
Run in parallel: T036 T038 T039
```
Example 4 (unit polish tests):
```
Run in parallel: T049 T050 T051
```

## Dependency Notes
- Tests (T008–T015) precede all implementation modules they reference.
- Hash utilities (T016/T017) needed before asset export (T029) and emitter hashing in versioning (T034).
- Traversal (T022) precedes transform modules (T025–T028) but can be scaffolded first.
- Versioning (T034/T035) requires hashing + emitter.
- Summary (T037) requires warnings (T039) and timings (T038).
- CLI run (T041) depends on all pipeline modules.

## Validation Checklist
- All entities have representation tasks.
- Contract schemas each have a test (T009–T011).
- User stories mapped via integration tests (warning cap, fidelity, hash stability, variant merge).
- Determinism & fidelity gates enforced by tasks T016, T034, T043.
- Override and large doc gating represented (T046, T047).

---
*Generated on 2025-09-27 (Constitution v1.0.0)*
