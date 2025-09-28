# Quickstart: Deterministic Figma → React Converter

## Prerequisites
- Node.js 18+
- FIGMA_TOKEN environment variable (Personal Access Token)
- Tailwind CSS configured in consuming Next.js project

## Basic Command (Planned Interface)
```
node ./generator/dist/cli/index.js \
  --file <FIGMA_FILE_KEY> \
  --node <FRAME_OR_COMPONENT_ID> \
  --out ./generated \
  --reuse-components \
  --variants \
  --verbose-trace
```

## Important Flags
- `--ignore-warning-threshold`: Allow completion even if >5% warnings (flagged in summary)
- `--max-depth <n>`: Override default recursion depth (25)
- `--node-count-threshold <n>` / `--depth-threshold <n>`: Override large-doc gating defaults (3000 / 12)
- `--variants`: Enable responsive variant merging using name suffix or width classification
- `--disable-headings`: Disable semantic heading inference
- `--out <dir>`: Target parent directory for new version subdirectory

## Versioning
Each run creates directory: `vYYYYMMDD-HHMM-<hash>/`.
Component files inside carry `.vN` suffix where N increments per run for that component.
A version map log references previous version and file hashes.

## Ignoring Layers
Prefix layer name with `_ignore` (case-insensitive) to skip.

## Outputs
- React component files (TSX)
- Assets (images/SVG) with `name--hash.ext`
- `summary.json` complying with `contracts/summary.schema.json`
- `trace.json` list per `contracts/trace.schema.json`
- `version-map.json` accumulation log

## Performance Guidance
Typical frame (≤800 nodes) target <5s. Summary includes phase timings.

## Failure Modes
- Missing FIGMA_TOKEN → immediate error
- Warning cap exceeded (without override) → run failure
- Fidelity violation (>1px delta) → run failure
- Large doc threshold exceeded without confirmation → aborted (no partial output)

## Next Steps
1. Complete implementation plan tasks
2. Generate tasks via /tasks command
3. Implement modules in order: hashing → Figma fetch → transform → layout → emit → versioning → observability
