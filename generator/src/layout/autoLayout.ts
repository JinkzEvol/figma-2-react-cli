/**
 * Maps simplified auto layout properties to Tailwind utility classes.
 * This is an initial heuristic; refined in later tasks & tests (T028, T064).
 */

export interface AutoLayoutProps {
  direction?: 'HORIZONTAL' | 'VERTICAL';
  gap?: number; // px
  alignItems?: 'MIN' | 'CENTER' | 'MAX';
  justifyContent?: 'MIN' | 'CENTER' | 'MAX' | 'SPACE_BETWEEN';
  padding?: { top: number; right: number; bottom: number; left: number };
}

export interface AutoLayoutResult {
  classes: string[];
}

function gapToClass(gap?: number): string | undefined {
  if (gap == null) return undefined;
  if (gap === 0) return 'gap-0';
  // Use arbitrary value for now; future: map to spacing scale where possible
  return `gap-[${Math.round(gap)}px]`;
}

function alignToClass(axis: 'items' | 'justify', value?: string): string | undefined {
  if (!value) return undefined;
  switch (value) {
    case 'MIN':
      return axis === 'items' ? 'items-start' : 'justify-start';
    case 'CENTER':
      return axis === 'items' ? 'items-center' : 'justify-center';
    case 'MAX':
      return axis === 'items' ? 'items-end' : 'justify-end';
    case 'SPACE_BETWEEN':
      if (axis === 'justify') return 'justify-between';
      return undefined;
    default:
      return undefined;
  }
}

function paddingToClasses(p?: AutoLayoutProps['padding']): string[] {
  if (!p) return [];
  const { top, right, bottom, left } = p;
  // Collapse to shorthand when uniform; else use explicit arbitrary px
  if (top === right && right === bottom && bottom === left) {
    if (!top) return [];
    return [`p-[${Math.round(top)}px]`];
  }
  const out: string[] = [];
  if (top) out.push(`pt-[${Math.round(top)}px]`);
  if (right) out.push(`pr-[${Math.round(right)}px]`);
  if (bottom) out.push(`pb-[${Math.round(bottom)}px]`);
  if (left) out.push(`pl-[${Math.round(left)}px]`);
  return out;
}

export function mapAutoLayout(props: AutoLayoutProps): AutoLayoutResult {
  const classes: string[] = [];
  if (props.direction === 'HORIZONTAL') classes.push('flex', 'flex-row');
  else if (props.direction === 'VERTICAL') classes.push('flex', 'flex-col');

  const g = gapToClass(props.gap);
  if (g) classes.push(g);

  const alignItems = alignToClass('items', props.alignItems);
  if (alignItems) classes.push(alignItems);
  const justify = alignToClass('justify', props.justifyContent);
  if (justify) classes.push(justify);

  classes.push(...paddingToClasses(props.padding));

  return { classes };
}
