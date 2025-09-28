/**
 * Font embedding / fallback logic (T056)
 * Simplified: attempts to resolve a provided font family against an allowlist.
 * If not present, applies a deterministic fallback stack and records a warning via callback.
 */

export interface ResolveFontOptions {
  fontFamily?: string;
  availableFamilies?: string[]; // Provided by environment / pre-scan (stub for now)
  warn?: (code: string, message: string) => void;
}

export interface ResolvedFont {
  primary: string;          // Chosen (possibly substituted) primary family
  stack: string[];          // Tailwind / CSS fallback stack
  substituted: boolean;     // True if original was replaced
  original?: string;        // Original requested family
}

// Deterministic minimal fallback stacks (extendable later)
const FALLBACK_STACKS: Record<string, string[]> = {
  'inter': ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
  'roboto': ['Roboto', 'ui-sans-serif', 'system-ui', 'sans-serif'],
  'default-sans': ['ui-sans-serif', 'system-ui', 'sans-serif'],
  'default-serif': ['ui-serif', 'Georgia', 'serif'],
  'default-mono': ['ui-monospace', 'SFMono-Regular', 'monospace']
};

const NORMALIZE = /[^a-z0-9]+/g;

function canonicalKey(name?: string): string | undefined {
  if (!name) return undefined;
  return name.toLowerCase().replace(NORMALIZE, '-');
}

export function resolveFont(opts: ResolveFontOptions): ResolvedFont {
  const requested = opts.fontFamily?.trim();
  const key = canonicalKey(requested);
  const available = (opts.availableFamilies || []).map(canonicalKey);

  if (requested && key && available.includes(key)) {
    // Provided font is available → pick an appropriate known stack if we have one.
    const stack = FALLBACK_STACKS[key] || [requested, 'ui-sans-serif', 'system-ui', 'sans-serif'];
    return { primary: stack[0], stack, substituted: false, original: requested };
  }

  // Try heuristic mapping by category keywords
  let stack: string[] | undefined;
  if (key && key.includes('serif')) stack = FALLBACK_STACKS['default-serif'];
  else if (key && (key.includes('mono') || key.includes('code'))) stack = FALLBACK_STACKS['default-mono'];
  else if (key && FALLBACK_STACKS[key]) stack = FALLBACK_STACKS[key];

  if (!stack) {
    stack = FALLBACK_STACKS['default-sans'];
  }

  if (requested && opts.warn) {
    opts.warn('FONT_SUBSTITUTED', `Font "${requested}" not available; substituted with ${stack[0]}`);
  }

  return { primary: stack[0], stack, substituted: true, original: requested };
}

export function fontStackToClass(resolved: ResolvedFont): string {
  // Tailwind arbitrary font-family utility
  const css = resolved.stack.map(f => (f.includes(' ') ? `"${f}"` : f)).join(',');
  return `font-[${css}]`;
}
