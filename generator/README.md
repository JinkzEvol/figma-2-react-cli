# Generator Package

This package houses the deterministic Figma → React converter CLI described in `specs/001-deterministic-figma-to/`. It transforms a selected Figma node into versioned Next.js-compatible components, assets, and observability artifacts.

## Module Overview

- `src/cli/` — argument parsing, run orchestration, large-document confirmation hooks.
- `src/connectivity/` — live fetch session, replay loader/writer, connectivity models.
- `src/figma/` — REST client wrapper and prescan heuristics.
- `src/transform/` — traversal, typography, color resolution, text splitting, component reuse.
- `src/layout/` — auto layout heuristics, absolute layout fallback, diff comparator.
- `src/responsive/` — variant parsing and merge logic.
- `src/assets/` — deterministic asset export with hashed filenames and collision handling.
- `src/emit/` — JSX/Tailwind emitter maintaining class ordering guarantees.
- `src/versioning/` — version directory management, mapping log, and retention helper.
- `src/observability/` — warnings, trace builder, summary assembly, timing utilities.
- `tests/` — contract, unit, integration, connectivity, and snapshot coverage grouped by domain.

## Usage Example

```pwsh
node ./generator/dist/cli/index.js `
	--file <FIGMA_FILE_KEY> `
	--node <FRAME_OR_COMPONENT_ID> `
	--out ./generator/generated `
	--reuse-components `
	--variants `
	--verbose-trace
```

`summary.json`, `trace.json`, component `.tsx` files, assets, and `version-map.json` are written into a new `vYYYYMMDD-HHMM-<hash>/` directory on each run.

## Key Flags & Modes

- `--ignore-warning-threshold` — proceed when warning count exceeds 5% (summary records override notice).
- `--max-depth <n>` / `--node-count-threshold <n>` — override traversal protection defaults (25 / 3000).
- `--disable-headings` — emit neutral elements instead of inferred heading tags.
- `--variants` — enable responsive variant merging (name suffix or width classification).
- `--capture-replay` — live fetch plus capture a deterministic replay bundle in `generated-replay/` (requires `FIGMA_TOKEN`).
- `--replay <path>` — run entirely from a captured bundle (`usedNetwork=false` in summary).
- `--allow-large-file` — acknowledge large-document gating after reviewing warnings.

Connectivity adds exit code `6` for rate-limit/retry exhaustion and `7` for authentication failures. Token values are never logged; warning messages redact sensitive credentials (FR-021).

## Test Suites

```pwsh
npm test                   # full suite
npm run test:connectivity  # connectivity and replay-specific cases
npm run test:summary-contracts  # JSON schema contract coverage
```

Connectivity fixtures live under `tests/connectivity/__fixtures__/`; `quickstart/` contains paired live/replay bundles for documentation walk-throughs, while `payloads/` holds reusable API payload samples consumed by Jest.

## Retention Helper

Manual pruning is handled by `src/versioning/retention.ts`. It lists candidates by age or rank and deletes only when `--yes` is supplied:

```pwsh
npx ts-node src/versioning/retention.ts --root generator/generated --keep 5 --max-age 30      # dry-run
npx ts-node src/versioning/retention.ts --root generator/generated --keep 5 --max-age 30 --yes
```

Without `--yes`, the helper remains a dry-run and reports which directories would be removed. The module can also be consumed programmatically via `runRetention()` (see tests for usage).

## Tailwind Integration Note

The CLI emits Tailwind utility classes only; no runtime Tailwind processing occurs inside the generator. Ensure your Next.js project already has Tailwind configured (see `specs/001-deterministic-figma-to/quickstart.md`) before importing generated components.

> Tailwind configuration is treated as a peer dependency: the generator only references class names, leaving build-time processing to the host project.
