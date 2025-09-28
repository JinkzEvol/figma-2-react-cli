# AI Coding Agent Playbook for Figma-2-React

**Project Snapshot**
- Next.js app in `app/` is mostly scaffold; determinism-focused generator lives under `generator/` (TypeScript, Jest).
- CLI entry `generator/src/cli/index.ts` parses flags and forwards to `runPipeline` in `generator/src/cli/run.ts`.
- Specs in `specs/**` back contract tests; schemas load from `specs/001-deterministic-figma-to/contracts` unless `FEATURE_DIR` overrides.

**Pipeline Overview**
- `runPipeline` sequence: `figma/prescan` → large-doc gate via `cli/confirmLargeDoc` → `transform/traverse` → typography/layout mapping → `emit/componentEmitter`.
- Warnings flow through `observability/Warnings`; summary JSON (`observability/summary`) enforces the 5% warning cap (exit code 4 unless `--ignore-warning-threshold`).
- Versioning creates `vYYYYMMDD-HHMM-<hash>` directories per run, writes component files (`*.vN.tsx`), updates `version-map.json`, and can append `mapping-log.txt`.

**Key Modules**
- `figma/client.ts` wraps the REST API with retry/backoff hooks and requires `FIGMA_TOKEN` (stubs currently simulate fetches).
- `transform/` contains layer models, traversal, typography/color/font helpers, multi-style text splitting, and reuse detection (PascalCase via `transform/reuse.ts`).
- `layout/` converts auto-layout settings or absolute geometry into Tailwind heuristics; `layout/diff.ts` enforces ≤1px tolerance targets.
- `responsive/` parses `Name@breakpoint` or width bands and merges variants while tracking conflicts.
- `assets/export.ts` hashes bytes into `layer-name--hash.ext`, reuses identical content, and appends numeric suffixes on collisions.
- `versioning/` owns `ensureVersionDir`, `updateVersionMap`, and mapping logs; generated artifacts live under `generator/generated-*` (kept for history).
- `observability/` supplies timings, trace builder, and summary/trace writers; verbose trace saved when `--verbose-trace` is set.

**CLI & Environment**
- Required flags: `--file <fileKey>` and `--node <nodeId>`; defaults include `--out generated`, responsive toggle `--variants`, reuse toggle `--reuse-components` (logic in `transform/reuse.ts`), semantic toggle `--disable-headings`.
- Use `--ignore-warning-threshold` to bypass the warning cap (summary marks `overrideNotice`); test-only hooks (`testInjectWarnings`, `simulateFidelityFailure`, etc.) live on `runPipeline` opts.
- Large-doc confirmation is non-interactive: set `LARGE_DOC_AUTO_ACCEPT=1` or `LARGE_DOC_AUTO_DECLINE=1` for automation and CI.
- Replay/API connectivity work is specced in `specs/002` and `specs/003`; current pipeline still stubs network fetch with synthetic root nodes.

**Developer Workflow**
- Run generator tasks inside `generator/`: `npm install`, `npm run build`, `npm test`; Jest config is `generator/jest.config.cjs`.
- Contract tests emit versioned outputs under `generator/generated-*`; keep them under version control and avoid manual edits.
- Override `FEATURE_DIR` when schemas move; otherwise Ajv helpers default to `specs/001-deterministic-figma-to`.

**Conventions & Guardrails**
- Prefix `_ignore` on a Figma layer to skip traversal; depth limit defaults to 25 and emits `DEPTH_LIMIT_REACHED` warnings when exceeded.
- Deterministic hashing uses `hashing/canonical.ts` plus SHA-1 (8 chars); never introduce timestamps or randomness into emitted artifacts.
- Fonts resolve through `transform/fonts.ts`; substitutions raise `FONT_SUBSTITUTED` warnings and produce Tailwind arbitrary font utilities.
- Summary JSON must include `warningCap`, `overrideNotice`, timings, and variant metadata—validate against `contracts/*.schema.json` via contract tests.
- Prefer editing modules through their barrel exports (`generator/src/<area>/index.ts`) to keep import surfaces predictable.
