/**
 * Multi-style text splitter (T032).
 * Given a raw text string and style ranges, produces ordered segments with associated style indexes.
 */

export interface TextStyleRange {
  start: number; // inclusive
  end: number;   // exclusive
  styleId: string; // reference to a style bucket (typography/color)
}

export interface TextSegment {
  text: string;
  styleId: string;
}

export function splitText(raw: string, ranges: TextStyleRange[]): TextSegment[] {
  if (!raw) return [];
  if (!Array.isArray(ranges) || ranges.length === 0) {
    return [{ text: raw, styleId: 'default' }];
  }
  // Normalize & sort ranges
  const normalized = ranges
    .map(r => ({ ...r, start: Math.max(0, r.start), end: Math.min(raw.length, r.end) }))
    .filter(r => r.end > r.start)
    .sort((a, b) => a.start - b.start || a.end - b.end);

  const result: TextSegment[] = [];
  let cursor = 0;
  for (const r of normalized) {
    if (r.start > cursor) {
      result.push({ text: raw.slice(cursor, r.start), styleId: 'default' });
    }
    result.push({ text: raw.slice(r.start, r.end), styleId: r.styleId });
    cursor = r.end;
  }
  if (cursor < raw.length) {
    result.push({ text: raw.slice(cursor), styleId: 'default' });
  }
  return result;
}
