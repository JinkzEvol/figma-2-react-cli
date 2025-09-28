/**
 * Canonical serialization used for deterministic hashing (R-02 research decision).
 * Rules:
 *  - Recursive walk
 *  - Numbers rounded to 4 decimal places (remove trailing zeros via parseFloat)
 *  - Strings trimmed and internal consecutive whitespace collapsed to a single space
 *  - Null / undefined properties omitted entirely
 *  - Object keys sorted ASCII ascending
 *  - Arrays preserved order (elements individually canonicalized)
 *  - Boolean & other primitive types serialized directly
 */
export declare function canonicalize(value: unknown): string;
export declare const canonicalSerialize: typeof canonicalize;
