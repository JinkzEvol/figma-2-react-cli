# Phase 0 Research: Deterministic Figma → React Conversion

Date: 2025-09-27
Related Spec: specs/001-deterministic-figma-to/spec.md

## R-01 Figma API Selective Fetch
- Decision: Use `files/:key/nodes` endpoint with targeted node IDs (selected frame + referenced component sets) instead of full file fetch when possible.
- Rationale: Minimizes payload size, speeds adaptive pre-scan, reduces rate-limit pressure.
- Alternatives Considered:
  - Full `files/:key` fetch: Simpler but large payload for big documents.
  - Multiple per-node requests: Higher latency & rate limit risk.

## R-02 Canonical Serialization for Hashing
- Decision: Serialize objects with stable key sort (ASCII), omit null/undefined fields, round numeric values to 4 decimal places, normalize whitespace in text (collapse consecutive spaces) before SHA-1 digest; include nodeId + assetType discriminator.
- Rationale: Eliminates nondeterministic ordering & float jitter producing hash churn.
- Alternatives Considered:
  - Native JSON.stringify: Key order not guaranteed across environments.
  - Lossless full precision: Unnecessary; floats beyond 4dp do not affect rendered pixel output.

## R-03 Layout Fidelity Test Strategy
- Decision: Use JSDOM + computed style extraction for width/height/position plus fallback headless browser (Playwright) only when discrepancies flagged in CI (optional) to confirm complex flex behaviors.
- Rationale: JSDOM is fast for most geometry; escalates only when needed.
- Alternatives Considered:
  - Always headless browser: Higher runtime cost.
  - Pure static diff of style strings: Misses final computed layout adjustments.

## R-04 Performance Instrumentation Granularity
- Decision: Capture timings for phases: fetch, preScan, transform, assetExport, emit, writeFiles, total; emit JSON timings block in summary.
- Rationale: Enables targeted optimization if <5s target missed.
- Alternatives Considered:
  - Single total timing: Lacks diagnostic resolution.
  - Per-node timing: Excessive overhead & log noise.

## R-05 Responsive Variant Suffix Parsing
- Decision: Regex: `^(?<base>[A-Za-z0-9_-]+?)(?:[@\.](?<bp>base|sm|md|lg|xl|2xl))?$`; if bp absent classify by width band; conflict rule: second frame with identical resolved bp triggers merge warning & exclusion.
- Rationale: Supports both `@` and `.` styles; explicit base extraction.
- Alternatives Considered:
  - Only `@` notation: Less flexible.
  - Width-only classification: Loses designer intent when suffix provided.

## R-06 Warning Cap Override Handling
- Decision: When `--ignore-warning-threshold` used, summary.flagOverride=true and warning: "Warning threshold bypassed" added.
- Rationale: Provides audit trail of override usage.
- Alternatives Considered: Silent override (rejected for traceability).

## R-07 Depth Limit Handling
- Decision: If depth > configured (default 25) for a branch, stop descending; create warning `DEPTH_LIMIT_REACHED` listing truncated nodeId.
- Rationale: Prevent runaway traversal.
- Alternatives Considered: Hard fail (too strict), continue (risk performance issues).

## R-08 Asset Naming Collision Strategy
- Decision: If sanitizedBase + hash ext already exists with different content hash (should not happen if hash stable), append incremental numeric suffix before `--hash` (e.g., `hero-2--abcd1234.png`).
- Rationale: Avoid silent overwrite & maintain determinism.
- Alternatives Considered: Overwrite (data loss risk), fail (unnecessary interruption).

## Summary Table
| ID | Decision | Status |
|----|----------|--------|
| R-01 | Node-scoped fetch | Adopted |
| R-02 | Canonical serializer | Adopted |
| R-03 | JSDOM primary, headless escalation | Adopted |
| R-04 | Phase timing segmentation | Adopted |
| R-05 | Flexible variant suffix regex | Adopted |
| R-06 | Override audit flag | Adopted |
| R-07 | Depth truncation with warning | Adopted |
| R-08 | Collision numeric suffix | Adopted |

All research decisions feed into Phase 1 design artifacts.
