import { describe, test, expect } from '@jest/globals';
import { parseVariants } from '../../src/responsive/variants';
import { mergeVariants } from '../../src/responsive/merge';

describe('integration: responsive variant merge', () => {
  test('merges base and breakpoint variants in ascending order', () => {
    const names = ['Card', 'Card@sm', 'Card@lg', 'Card@md', 'Card@2xl'];
    const parsed = parseVariants(names);
    const merged = mergeVariants(parsed, (raw) => raw.toUpperCase());
    expect(merged).toHaveLength(1);
    const m = merged[0];
    expect(m.baseName).toBe('Card');
    const order = m.variants.map(v => v.breakpoint);
    expect(order).toEqual(['base', 'sm', 'md', 'lg', '2xl']);
  });

  test('records conflicts when duplicate breakpoints appear', () => {
    const names = ['Hero', 'Hero@sm', 'Hero@sm', 'Hero@lg'];
    const warnings: string[] = [];
    const parsed = parseVariants(names, { warn: msg => warnings.push(msg) });
    const merged = mergeVariants(parsed, (raw) => raw);
    const hero = merged.find(m => m.baseName === 'Hero');
    expect(hero).toBeDefined();
    expect(hero?.conflicts).toContain('sm');
    expect(warnings.some(w => w.includes('Duplicate variant breakpoint'))).toBe(true);
  });
});
