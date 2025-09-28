# Feature Specification: Deterministic Figma → Next.js React Tailwind Conversion Tool

**Feature Branch**: `001-deterministic-figma-to`  
**Created**: 2025-09-27  
**Status**: Draft  
**Input**: User description: "Deterministic Figma to Next.js React Tailwind conversion tool (Figroot-like)"

## Execution Flow (main)
```
1. Parse user description from Input
   → If empty: ERROR "No feature description provided"
2. Extract key concepts from description
   → Identify: actors, actions, data, constraints
3. For each unclear aspect:
   → Mark with [NEEDS CLARIFICATION: specific question]
4. Fill User Scenarios & Testing section
   → If no clear user flow: ERROR "Cannot determine user scenarios"
5. Generate Functional Requirements
   → Each requirement must be testable
   → Mark ambiguous requirements
6. Identify Key Entities (if data involved)
7. Run Review Checklist
   → If any [NEEDS CLARIFICATION]: WARN "Spec has uncertainties"
   → If implementation details found: ERROR "Remove tech details"
8. Return: SUCCESS (spec ready for planning)
```

---

## ⚡ Quick Guidelines
- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

### Section Requirements
- **Mandatory sections**: Must be completed for every feature
- **Optional sections**: Include only when relevant to the feature
- When a section doesn't apply, remove it entirely (don't leave as "N/A")

### For AI Generation
When creating this spec from a user prompt:
1. **Mark all ambiguities**: Use [NEEDS CLARIFICATION: specific question] for any assumption you'd need to make
2. **Don't guess**: If the prompt doesn't specify something (e.g., "login system" without auth method), mark it
3. **Think like a tester**: Every vague requirement should fail the "testable and unambiguous" checklist item
4. **Common underspecified areas**:
   - User types and permissions
   - Data retention/deletion policies  
   - Performance targets and scale
   - Error handling behaviors
   - Integration requirements
   - Security/compliance needs

---

## Clarifications

### Session 2025-09-27
- Q: How should the tool handle extremely large Figma node trees (performance & scope control)? → A: Adaptive sampling + user confirmation (Option D)
- Q: When re-running conversion for same node, how handle existing generated files? → A: Create new versioned file per run (Option C)
- Q: Asset naming convention? → A: Layer name + short hash suffix (Option C)
- Q: Maximum layout deviation tolerance? → A: 1px tolerance (Option B)
- Q: Warning threshold policy? → A: Fail if warnings > 5% of total traversed nodes
- Q: Strategy for custom fonts not present locally? → A: Attempt @font-face embed if license & retrieval allowed; else map to nearest fallback and warn (B then C)
- Q: Breakpoint detection heuristic? → A: Infer by frame width thresholds using default Tailwind breakpoints (Option A)
- Q: Adaptive threshold defaults? → A: 3,000 nodes or depth > 12 triggers confirmation (Option A)
- Q: Version retention policy? → A: Manual only; never auto-delete (Option D)
- Q: Hash algorithm selection? → A: SHA-1 (Option A)

Applied Resolution:
- Introduce adaptive pre-scan: perform lightweight sampling (shallow traversal) to estimate total node count and max depth before full conversion.
- If projected size exceeds configurable thresholds, system MUST prompt user (or automation agent) for explicit confirmation; abort cleanly if declined.
- Versioned output strategy: each re-run for unchanged scope creates a new versioned artifact (e.g., `ComponentName.v2.tsx`) enabling diff inspection; original files remain untouched unless an explicit cleanup mode is invoked.
- Asset naming: sanitize layer name (kebab-case) + `--` + first 8 chars of SHA-1 content hash (e.g., `hero-image--a1b2c3d4.png`); collisions resolved by incrementing numeric suffix before hash. SHA-1 chosen for speed + sufficient uniqueness (non-security use). Hashing input = normalized binary (for images) or serialized vector data (for SVG) + nodeId.
- Layout fidelity gate: export considered successful if all element width/height/position deltas ≤ 1px; deviations >1px contribute to failure metrics.
- Warning threshold: dynamic cap = floor(total traversed nodes * 0.05). If warnings > cap, run fails with explicit summary.
- Font handling: For each font not locally resolvable, attempt retrieval/embedding (respecting license metadata). If retrieval blocked or disallowed, substitute configured fallback stack (e.g., `ui-sans-serif, system-ui`) and log a font-substitution warning referencing affected text nodes.
- Breakpoint inference: Frames grouped for responsive merging when their widths fall under standard Tailwind ranges (e.g., <640=base/mobile, 640–767=sm, 768–1023=md, 1024–1279=lg, 1280–1535=xl, ≥1536=2xl) and share a common semantic base name (case-insensitive); widths drive classification primarily.
- Default adaptive thresholds established: nodeCountThreshold=3000, depthThreshold=12 (configurable overrides allowed). Version retention, hash algorithm remain pending; placeholders retained.

---

## User Scenarios & Testing *(mandatory)*

### Primary User Story
As a frontend developer or product engineer, I want to convert a selected Figma frame or component into pixel‑faithful React (Next.js compatible) JSX styled with Tailwind utility classes so that I can accelerate UI implementation while preserving the exact visual design.

### Secondary User Stories
1. As a developer maintaining a design system, I want repeated Figma components mapped to single reusable React components or to existing in‑repo components so that duplication is reduced.
2. As an agent (automation assistant), I want deterministic, explainable transformation steps so I can surface warnings and request clarifications from the user instead of producing unverifiable code.
3. As a designer/developer collaborator, I want exported assets (images, SVG) placed in a predictable folder so they can be versioned and updated easily.

### Acceptance Scenarios
1. **Given** a valid Figma file key and API token, **When** the user requests conversion of a specific frame, **Then** the system produces a React component file whose rendered layout matches the Figma frame’s dimensions, positioning, colors, typography, and spacing within 1px tolerance.
2. **Given** multiple instances of the same named Figma component, **When** reuse mode is enabled, **Then** only one corresponding React component definition is generated and all instances reference it.
3. **Given** a mapping of Figma component names to existing project components, **When** conversion runs, **Then** the output imports and uses those components instead of generating new JSX for their internals.
4. **Given** text layers with designated heading style names (e.g. "H1", "H2"), **When** conversion completes, **Then** the output uses appropriate semantic heading tags unless a clarification was flagged to disable semantic inference.
5. **Given** an element with unsupported effects (e.g., complex blur not representable), **When** conversion runs, **Then** the system inserts a placeholder or comment and records a warning in the summary.
6. **Given** color values not matching a known palette, **When** conversion runs, **Then** arbitrary Tailwind color classes (e.g., `text-[#1A2B3C]`) or inline styles are applied to preserve exact appearance.
7. **Given** a second export run over the same scope, **When** versioning mode is active, **Then** a new versioned component file is created without overwriting the prior version and a summary links both versions.

### Edge Cases
- Figma file extremely large (performance constraints) → Adaptive pre-scan estimates nodeCount & maxDepth; if either exceeds configured thresholds (nodeCountThreshold=3000 / depthThreshold=12) prompt for confirmation; abort if declined; warn if proceeding under high-load conditions.
- Figma file large but below threshold (≤3000 nodes & depth ≤12) → proceed automatically.
- Figma file exceeding threshold (>3000 nodes or depth >12) → require confirmation; on acceptance note large-document flag in summary.
- Missing or invalid Figma API token → Fail fast with clear error message and no partial files.
- Frame contains video / animation / Lottie layer → Insert placeholder container with warning for manual implementation.
- Boolean vector operations or complex vector groups → Export as optimized SVG asset with a reference; warn if simplification performed.
- Overlapping absolutely positioned elements with ambiguous z-order → Use Figma layer order; warn if explicit z-index inference needed.
- Text with mixed styles within a single node → Split into multiple spans preserving style sequence.
- Responsive variants (multiple frames for breakpoints) provided → Merge using width-threshold classification; if two frames map to same breakpoint width band, treat as conflict and warn.
- Designer renamed layers after export run → Subsequent re-run may create divergent file names [NEEDS CLARIFICATION: strategy for idempotent naming].
- Excessive version proliferation (many re-runs) → User responsible for manual cleanup; system provides summary size report and optional generated cleanup script (dry-run prompt first).

### Out-of-Scope (Clarifying Boundaries)
- Authentication, state management, or data fetching behaviors.
- Business logic or event handlers beyond structural placeholders.
- Two-way sync (code back into Figma) – strictly one-way export.
- Automatic semantic refactoring beyond minimal heading inference.

### Assumptions
- Figma design uses a consistent 4px (or derivative) spacing scale; arbitrary values still allowed.
- Project already configured with Tailwind; classes produced will be interpreted correctly.
- Developers will review and refactor generated code before production.
- Font licenses permit embedding when available; if not, fallback substitution is acceptable to stakeholders.

### Open Questions (Resolved / Finalized)
All previously open questions have been resolved:
1. Versioning scheme: Use BOTH a versioned directory and incremental component suffix. Directory format: `vYYYYMMDD-HHMM-<8charHash>` created per run; inside, component files include an incrementing `.vN` suffix (starting at `.v1`).
2. Retention policy: Manual only (no auto pruning). Retention helper lists candidates; user confirms deletions.
3. Override flag name: `--ignore-warning-threshold` bypasses 5% warning failure gate (still logs warning about override usage).
4. Ignore-layer naming convention: Any Figma layer whose name starts with `_ignore` (case-insensitive) is skipped (not traversed, not exported) and logged as ignored-layer (info level, not warning).
5. Idempotent naming on designer layer rename: Historical linkage preserved via nodeId; if layer name changes, new asset filename generated; summary logs rename detection (old → new) for traceability (no reuse of prior filename intentionally to reflect design change). This is accepted behavior.
6. Variant identification rule: Frames sharing a base name with optional `@<breakpoint>` or `.<breakpoint>` suffix (e.g., `Hero@md`, `Hero.lg`). If suffix absent, width classification alone groups variants; conflicts where same breakpoint appears twice produce a merge warning and exclude later duplicate.
7. Default maximum recursion depth: 25 (configurable). Depth beyond limit aborts traversal of that branch with a depth-limit warning.
8. Performance target: <5s for a typical frame (≤800 nodes). Exceeding target logs a performance warning; does not fail run.

## Requirements *(mandatory)*

### Functional Requirements
- **FR-001**: System MUST accept a Figma file key and optionally a target frame/component identifier to define the conversion scope.
- **FR-002**: System MUST validate presence of a Figma API token before attempting any network fetch; on absence MUST produce a clear error and abort.
- **FR-003**: System MUST fetch only the necessary portion of the Figma document needed for the requested node to minimize processing time.
- **FR-004**: System MUST traverse the selected node subtree and transform every supported layer into a structured internal representation of layout and style attributes.
- **FR-005**: System MUST generate deterministic React (Next.js compatible) component code whose rendered output visually matches source design within a 1px positional and size variance.
- **FR-006**: System MUST translate Figma Auto Layout to flexbox orientation, alignment, spacing, and gap constructs in the output specification.
- **FR-007**: System MUST preserve absolute positioning for elements not governed by Auto Layout using offset metrics from the parent frame.
- **FR-008**: System MUST convert text style properties (font family, size, weight, line height, color) into declarative style tokens (Tailwind classes or arbitrary values) without loss of fidelity.
- **FR-009**: System MUST export raster or vector assets required by layers (e.g., images, complex vectors) and reference them via relative paths in the generated code.
- **FR-010**: System MUST detect repeated named Figma components and, when reuse mode is enabled, emit a single component abstraction and reference it for each instance.
- **FR-011**: System MUST honor a provided mapping of Figma component names to existing project component import paths, substituting those references instead of generating new JSX.
- **FR-012**: System MUST record warnings for unsupported layer types or effects and insert code comments at the corresponding location.
- **FR-013**: System MUST produce a structured summary (counts, warnings, reused components, variantConflicts[]) for post-run review.
- **FR-014**: System MUST allow configuration of color mapping to prefer existing design tokens when hex values match provided palette entries.
- **FR-015**: System MUST split multi-style text nodes into multiple inline elements preserving order and styling when mixed formatting exists.
- **FR-016**: System MUST provide an option to disable semantic tag inference (headings) when strict visual div/span output is required.
- **FR-017**: System MUST fail the run if dynamic warning count > 5% of traversed nodes (rounded down) unless the `--ignore-warning-threshold` flag is supplied; when supplied, run completes with a flagged status in summary. The summary MUST clearly indicate override usage and include an `overrideNotice` field.
- **FR-018**: System MUST ensure repeat runs retain previous output by generating a new directory `vYYYYMMDD-HHMM-<8charHash>/` and inside it component files with an incrementing `.vN` suffix (starting at `.v1`) rather than overwriting previous versions; retention is manual only.
- **FR-019**: System MUST generate human-readable layer-to-code comments when verbose trace mode is enabled. The per-node trace MUST include for every non-ignored layer: `layerId`, `layerName`, `type`, `ignored` flag, `actions[]` (ordered transformation steps), `warnings[]` (codes), in deterministic traversal order.
- **FR-020**: System MUST not introduce business logic, event handlers, or stateful code beyond placeholders.
- **FR-021**: System MUST expose a mechanism to mark certain Figma layers to be ignored via name prefix `_ignore` (case-insensitive); ignored layers are neither transformed nor emitted.
- **FR-022**: System MUST output only deterministic values (no timestamps or random IDs) in generated component code.
- **FR-023**: System MUST support merging multiple frame variants into a single responsive component when variant merging is requested; variants identified by shared base name plus optional `@<breakpoint>` or `.<breakpoint>` suffix, or by width classification if suffix absent.
- **FR-024**: System MUST provide a clear error when the requested frame/component identifier does not exist in the file.
- **FR-025**: System MUST preserve z-order stacking consistent with Figma layer ordering.
- **FR-026**: System MUST log (in summary) any fallback from Tailwind scale value to arbitrary value usage for auditing.
- **FR-027**: System MUST allow configuration for maximum recursion depth (default 25) to protect against pathological documents; deeper branches are truncated with a warning.
- **FR-028**: System MUST produce export results within a target time budget of <5s for a typical frame (≤800 nodes) measured on a reference environment (Node.js 18, 4 vCPU ~2.5GHz, 8GB RAM); exceeding target logs a performance warning including timing breakdown (not a failure).
- **FR-029**: System MUST ensure all referenced asset files exist on disk post-run (no dangling imports).
- **FR-030**: System MUST provide a machine-readable report (e.g., JSON) summarizing entities and warnings.
- **FR-031**: System MUST perform an adaptive pre-scan (estimating node count and depth) and require explicit confirmation when projected size exceeds nodeCountThreshold (default 3000) or depthThreshold (default 12); both thresholds configurable via settings.
- **FR-032**: System MUST maintain and expose a mapping log linking each versioned export to its originating Figma file key, node id, timestamp, and prior version reference.
- **FR-033**: System MUST generate asset file names using sanitized layer name plus short content hash suffix (e.g., `layer-name--abcdefgh.ext`) providing stability across runs unless the underlying asset binary changes.
- **FR-034**: System MUST validate final rendered layout against Figma geometry and fail fidelity checks if any element's positional (x,y) or dimensional (w,h) delta exceeds 1px. Exit codes MUST differentiate fidelity failure from warning threshold failure.
- **FR-035**: System MUST include in the summary the calculated warning cap, actual warning count, and pass/fail rationale when warnings exceed or meet thresholds.
- **FR-036**: System MUST attempt to embed externally referenced fonts via @font-face when permissible; if embedding fails or is disallowed, apply a configured fallback font stack and record a substitution warning including original font name and affected node IDs.
- **FR-037**: System MUST classify frames into responsive breakpoints based on width ranges aligned with Tailwind defaults (base,<640; sm,640–767; md,768–1023; lg,1024–1279; xl,1280–1535; 2xl,≥1536) and merge variants sharing base name; conflicting duplicates in same range produce a merge warning and exclude the later duplicate from responsive output.
- **FR-038**: System MUST provide a manual retention aid command (dry-run + execute) listing versioned artifacts older than a configurable age or beyond a user-specified count threshold without performing automatic deletions by default.
- **FR-039**: System MUST generate SHA-1 hashes for asset/content fingerprinting and truncate to first 8 hex characters for readability; hashing must be stable across runs for identical binary/vector input.

### Key Entities
- **Design Source**: Represents the Figma document subset (file key + selected node id). Attributes: fileKey, nodeId, nodeName, retrievalTimestamp.
- **Layer**: Abstract representation of a Figma node (type, name, bounds, styles, children, relationships).
- **Component Definition**: Logical grouping representing a reusable component extracted from repeated Figma components; attributes: componentName, occurrences, sourceNodeIds.
- **Asset**: Exported media (image/SVG) with attributes: originalNodeId, filename, type, sizeBytes, contentHash, versionRef.
- **Warning**: Issue encountered during conversion; attributes: code, message, layerRef, severity.
- **Export Summary**: Aggregated metadata about a run (layerCount, componentCount, assetCount, warningCount, exceededThresholdFlag).

---

## Review & Acceptance Checklist
*GATE: Automated checks run during main() execution*

### Content Quality
- [ ] No implementation details (languages, frameworks, APIs)  
   (Contains technology names only insofar as part of feature intent; ensure removal later if over-specific.)
- [ ] Focused on user value and business needs
- [ ] Written for non-technical stakeholders
- [ ] All mandatory sections completed

### Requirement Completeness
- [ ] No [NEEDS CLARIFICATION] markers remain (currently present; requires resolution)
- [ ] Requirements are testable and unambiguous  
- [ ] Success criteria are measurable (pixel tolerance, warning thresholds once clarified)
- [ ] Scope is clearly bounded (export-only, no logic)
- [ ] Dependencies and assumptions identified

---

## Execution Status
*Updated by main() during processing*

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [ ] Review checklist passed (pending clarifications)

---
