/**
 * Color token resolver (T031).
 * Maps RGBA / HEX to a defined palette; falls back to arbitrary utility + logs fallback.
 */

export interface ColorResolverOptions {
  palette?: Record<string, string>; // name -> hex (#rrggbb)
  onFallback?: (input: string) => void; // logging callback
}

export function resolveColor(input: string, opts: ColorResolverOptions = {}): string {
  const palette = opts.palette || {};
  const normalized = normalizeHex(input);
  // Try direct palette value match
  for (const [name, hex] of Object.entries(palette)) {
    if (hex.toLowerCase() === normalized) return `text-${name}`;
  }
  // Not found → fallback arbitrary class + log
  opts.onFallback?.(input);
  return `text-[${input}]`;
}

function normalizeHex(color: string): string {
  const hex = color.trim();
  const m = hex.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
  if (!m) return hex.toLowerCase();
  if (m[1].length === 3) {
    // expand short notation
    const r = m[1][0];
    const g = m[1][1];
    const b = m[1][2];
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return `#${m[1].toLowerCase()}`;
}

export { normalizeHex };
