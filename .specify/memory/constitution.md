<!--
Sync Impact Report
Version: (new) 1.0.0
Version Change: (old) N/A → (new) 1.0.0 (Initial ratification)
Modified Principles: N/A (all newly defined)
Added Sections: Core Principles (6 defined), Constraints & Quality Gates, Delivery Workflow & Quality Gates, Governance
Removed Sections: Template placeholders removed
Templates Requiring Updates:
 - .specify/templates/plan-template.md ✅ (version reference updated separately)
 - .specify/templates/spec-template.md ✅ (no changes needed; already compatible)
 - .specify/templates/tasks-template.md ✅ (no changes needed; already compatible)
 - .specify/templates/agent-file-template.md ✅ (no constitution coupling; unchanged)
Deferred TODOs: None
-->

# Figma‑to‑React Deterministic Conversion Constitution

## Core Principles

### 1. Determinism Over Heuristics
All generated artifacts (components, assets, class names, version folders, logs) MUST be reproducible from identical Figma input + configuration.
No probabilistic, ML, or non‑deterministic ordering sources (e.g. unordered map iteration without stable sort) MAY influence output. Any source of nondeterminism (timestamps, random IDs) MUST be replaced with stable hashes or canonical ordering. A run with unchanged inputs MUST produce byte‑identical component source (excluding appended version folder name). Deviations are a defect.
Rationale: Guarantees diff clarity, enables safe re‑runs, and supports trust in automated pipelines.

### 2. Fidelity Within One Pixel
Layout geometry (x, y, width, height), spacing (gap, padding, margin), and font sizing MUST not deviate by more than 1px from Figma exported numeric values for supported constructs. Unsupported constructs MUST emit explicit warnings referencing node IDs. Any aggregate warning rate > threshold (5% of traversed nodes) MUST fail the run unless an explicit override flag is supplied (flag name defined in implementation plan). Pixel rounding rules MUST be documented and applied uniformly.
Rationale: Enforces “what you designed is what you ship,” limiting silent drift.

### 3. Test‑First & Contract Clarity
Every functional requirement (FR) MUST map to at least one automated test (contract, unit, or integration) before implementation steps that satisfy it are merged. New ambiguity discovered during implementation MUST back‑propagate to the spec as a clarification before continuing. Tests MUST assert deterministic hashing, version naming, layout fidelity, and threshold fail behaviors. No feature code merges without failing tests that then turn green.
Rationale: Prevents regression, encodes decisions as executable truth, and sustains determinism.

### 4. Transparent Observability & Traceability
Each run MUST produce: (a) structured summary (counts, warning %), (b) per‑node transformation log (layer id → component/asset mapping), (c) version identifier, (d) deterministic asset hash summary. Logs MUST be stable in ordering (sorted by traversal path). Warning messages MUST include actionable context (node name, id, category, remediation hint). Silent failures are prohibited: absence of capability MUST be a warning or error, never ignored.
Rationale: Enables rapid diff investigation and trust in automation.

### 5. Minimalism & Incremental Complexity
The simplest viable mapping (direct Tailwind utilities, no abstraction layers) MUST be preferred until a complexity trigger is met (duplication of ≥3 identical utility sequences OR explicit performance constraint). Any new abstraction (custom component wrapper, style token) MUST document: purpose, duplication evidence, and rollback path. YAGNI: speculative extension points are disallowed.
Rationale: Reduces maintenance surface and cognitive load.

### 6. Explicit Versioned Idempotency
Each conversion run MUST write to a new versioned output directory (e.g., `vYYYYMMDD-HHMM-<hash>` or an agreed format) without overwriting prior versions. No automatic pruning occurs; a retention helper may propose deletions but MUST require explicit confirmation. Asset file names MUST combine sanitized layer base + stable truncated SHA‑1 (8 hex chars) derived from canonicalized content inputs. Re‑running with unchanged layer content MUST not alter the name.
Rationale: Enables diff‑based review, rollback, and forensic validation.

## Constraints & Quality Gates
1. Warning Threshold Gate: >5% node warnings ⇒ run failure (unless override flag explicitly set).
2. Large Document Gate: Pre‑scan triggers confirmation if node count ≥3000 OR depth >12.
3. Hash Stability: Hash inputs MUST be fully canonicalized (ordering, numeric precision, whitespace) before digest.
4. Dependency Policy: Introduce third‑party libs only when they remove ≥40 lines net complexity or supply security/standards compliance. Justification MUST appear in plan.md Complexity Tracking table.
5. Performance Expectation: Single frame/component conversion SHOULD complete in <5s for 95th percentile of typical design files (soft target; exceeding must log performance warning with timings breakdown).
6. Security & Licensing: Embedded fonts MUST have license clearance recorded (include license origin in log). If clearance absent, fallback font stack MUST be used and warning emitted.

## Delivery Workflow & Quality Gates
1. Spec → Plan → Tasks progression MUST respect gates: no /plan if outstanding [NEEDS CLARIFICATION], no /tasks if Constitution Check fails.
2. Constitution Check Sections in plan.md MUST enumerate any principle deviations with justification or block progression.
3. Tests MUST be authored (and fail) before implementation tasks that satisfy them; task ordering enforces this.
4. Every PR MUST include: (a) reference to principle(s) touched, (b) evidence for complexity additions, (c) summary of deterministic impact (hash stability, file count changes).
5. Observability Additions: New transformations MUST add log coverage in the per‑node trace before merge.

## Governance
1. Supremacy: This Constitution supersedes ad‑hoc conventions. Conflicts MUST be resolved in favor of constitutional text or amended accordingly.
2. Amendment Process:
	- Proposal: Draft change as PR modifying this file with Sync Impact Report.
	- Classification: Determine semantic version bump (MAJOR/MINOR/PATCH) per Versioning Policy below.
	- Review: At least one maintainer approval plus automated validation (no leftover placeholders, dates valid, principles testable).
	- Ratification: Merge commits change; update referenced version strings in templates.
3. Versioning Policy (Semantic Governance Versioning):
	- MAJOR: Removing or redefining a principle in a backward incompatible way.
	- MINOR: Adding a new principle or new mandatory gate, or materially expanding guidance that introduces new obligations.
	- PATCH: Wording clarity, typo fixes, non‑normative elaboration.
4. Compliance Review: Each /plan execution MUST copy current constitution version reference and evaluate violations. Failing to justify violations blocks progression.
5. Enforcement: Any merged change contradicting a principle without amendment constitutes a governance violation; remediation MUST be prioritized next work cycle.
6. Sunset / Retirement: Deprecated principles MUST include a deprecation note + planned removal version.
7. Traceability: The Sync Impact Report (top HTML comment) MUST reflect precise diffs in section scope for each amendment PR.

**Version**: 1.0.0 | **Ratified**: 2025-09-27 | **Last Amended**: 2025-09-27