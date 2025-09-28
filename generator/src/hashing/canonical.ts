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
export function canonicalize(value: unknown): string {
  const seen = new WeakSet<object>();

  function process(val: any): any {
    if (val === null || val === undefined) return undefined; // omit
    const t = typeof val;
    if (t === 'number') {
      if (Number.isNaN(val)) return 'NaN';
      if (!Number.isFinite(val)) return val > 0 ? 'Infinity' : '-Infinity';
      return parseFloat(val.toFixed(4));
    }
    if (t === 'string') {
      // Trim and collapse internal whitespace sequences to single space
      const trimmed = val.trim().replace(/\s+/g, ' ');
      return trimmed;
    }
    if (t === 'boolean') return val;
    if (Array.isArray(val)) {
      return val.map(v => process(v)).filter(v => v !== undefined);
    }
    if (t === 'object') {
      if (seen.has(val)) {
        // Circular reference guard – represent as null placeholder (should not occur in expected inputs)
        return null;
      }
      seen.add(val);
      const keys = Object.keys(val).sort();
      const out: Record<string, any> = {};
      for (const k of keys) {
        const processed = process(val[k]);
        if (processed !== undefined) out[k] = processed;
      }
      return out;
    }
    return val;
  }

  const processed = process(value);
  return JSON.stringify(processed);
}

// Alias export for clarity in tests/future refactors
export const canonicalSerialize = canonicalize;
