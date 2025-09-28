import { parseVariants } from '../../src/responsive/variants';
import { mergeVariants } from '../../src/responsive/merge';

describe('integration: variant ordering & conflicts', () => {
  test('ordered base→2xl and detects conflicts', () => {
    const names = ['Header@base', 'Header@md', 'Header@sm', 'Header@sm']; // duplicate sm to force conflict
    const warnings: string[] = [];
    const parsed = parseVariants(names, { warn: w => warnings.push(w) });
    const merged = mergeVariants(parsed, raw => ({ raw }));

    const order = merged[0].variants.map(v => v.breakpoint);
    expect(order).toEqual(['base', 'sm', 'md']); // only those supplied
    expect(merged[0].conflicts).toContain('sm');
    expect(warnings.some(w => w.includes('Duplicate variant breakpoint sm'))).toBe(true);
  });
});
