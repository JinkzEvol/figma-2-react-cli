# Data Model: Deterministic Figma → React Conversion

Generated: 2025-09-27
Spec Ref: specs/001-deterministic-figma-to/spec.md

## Entities

### DesignSource
| Field | Type | Notes |
|-------|------|-------|
| fileKey | string | Figma file key |
| nodeId | string | Root node for conversion |
| nodeName | string | Original Figma node name |
| retrievalTimestamp | string (ISO) | When fetched |

### Layer
| Field | Type | Notes |
|-------|------|-------|
| id | string | Figma node id |
| name | string | Raw name |
| type | string | Figma node type |
| bounds | {x:number,y:number,width:number,height:number} | Geometry |
| styles | object | Typography, fills, strokes |
| children | Layer[] | Ordered child nodes |
| isIgnored | boolean | Derived via `_ignore` prefix |
| hashBasis | string | Canonical serialization fragment |

### ComponentDefinition
| Field | Type | Notes |
|-------|------|-------|
| name | string | PascalCase component name |
| occurrences | number | Count of instances |
| sourceNodeIds | string[] | IDs of component instances |

### Asset
| Field | Type | Notes |
|-------|------|-------|
| originalNodeId | string | Source layer id |
| filename | string | `sanitized--hash.ext` |
| contentHash | string | 8-char SHA-1 prefix |
| type | enum(image,svg) | Asset category |
| sizeBytes | number | File size on disk |
| versionRef | string | Version directory name |

### Warning
| Field | Type | Notes |
|-------|------|-------|
| code | string | Machine code (e.g., UNSUPPORTED_EFFECT) |
| message | string | Human description |
| layerRef | string | Layer id (optional) |
| severity | enum(info,warning,error) | Severity classification |

### ExportSummary
| Field | Type | Notes |
|-------|------|-------|
| layerCount | number | Traversed layers |
| componentCount | number | Components generated |
| assetCount | number | Assets written |
| warningCount | number | Total warnings |
| warningCap | number | 5% floor value |
| exceededWarningCap | boolean | Whether run would have failed |
| overrideUsed | boolean | If `--ignore-warning-threshold` provided |
| largeDocument | boolean | Large doc gate triggered |
| timings | object | Phase timings |
| versionDir | string | Version directory name |
| variants | string[] | Breakpoint variants included |

### VersionRecord
| Field | Type | Notes |
|-------|------|-------|
| versionDir | string | `vYYYYMMDD-HHMM-hash` |
| baseComponent | string | Primary component name |
| runTimestamp | string | ISO time |
| previousVersionDir | string|null | Linked previous version |
| fileHashes | { [path:string]: string } | SHA-1 hashes of emitted files |

## Relationships
- DesignSource 1→N Layers (root subtree)
- Layer may reference ComponentDefinition when reused
- ComponentDefinition aggregates multiple Layer ids
- Layer may produce 0..1 Asset
- ExportSummary links to VersionRecord via versionDir

## Validation Rules
- 1px geometry tolerance: layout comparator enforces (FR-034)
- Warning cap: warningCount <= warningCap unless overrideUsed
- Depth limit: any truncated branch emits DEPTH_LIMIT_REACHED warning
- Asset filename uniqueness: no duplicate filename + hash pairs across same versionDir

## Derived / Computed Fields
- Layer.hashBasis: canonical serialization input fragment
- ExportSummary.warningCap: floor(layerCount * 0.05)
- Asset.filename: kebabCase(layer.name)+"--"+hash+ext

## Open Modeling Considerations
- Potential future: add `DesignTokenReference` entity if palette mapping expands.
