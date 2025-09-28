import { describe, expect, it, jest } from '@jest/globals';
import { ORDERED_BREAKPOINTS, parseVariantName, parseVariants } from '../../src/responsive/variants';

describe('variant parser edge cases', () => {
  it('parses both @ and . suffix patterns', () => {
    expect(parseVariantName('Hero@section')).toBeNull();
    expect(parseVariantName('Hero@lg')).toEqual({ baseName: 'Hero', breakpoint: 'lg' });
    expect(parseVariantName('Card.md')).toEqual({ baseName: 'Card', breakpoint: 'md' });
    expect(parseVariantName('Footer')).toEqual({ baseName: 'Footer', breakpoint: 'base' });
  });

  it('orders variants according to Tailwind breakpoint order', () => {
    const warn = jest.fn();
    const result = parseVariants(['Hero@md', 'Hero@sm', 'Hero@lg'], { warn });
    expect(result.map((r) => r.breakpoint)).toEqual(['sm', 'md', 'lg']);
    expect(result.every((r) => ORDERED_BREAKPOINTS.includes(r.breakpoint))).toBe(true);
    expect(warn).not.toHaveBeenCalled();
  });

  it('flags duplicate breakpoints as conflicts and warns once per duplicate', () => {
    const warn = jest.fn();
    const result = parseVariants(['Card@sm', 'Card@sm', 'Card@md'], { warn });
    const smVariant = result.find((r) => r.breakpoint === 'sm');
    expect(smVariant?.conflict).toBe(true);
    expect(result.filter((r) => r.breakpoint === 'sm')).toHaveLength(1);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain('Duplicate variant breakpoint sm');
  });

  it('ignores labels that fail to match the variant pattern', () => {
    const warn = jest.fn();
    const result = parseVariants(['Hero@md', 'Invalid@xxx', 'Plain Label'], { warn });
    expect(result.map((r) => r.rawName)).toEqual(['Hero@md']);
    expect(warn).not.toHaveBeenCalled();
  });
});
