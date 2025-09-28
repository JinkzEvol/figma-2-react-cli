import { resolveFont, fontStackToClass } from '../../src/transform/fonts';

describe('font fallback integration (T060)', () => {
  test('substitutes unavailable font with deterministic stack and warns via callback', () => {
    const warnings: { code: string; message: string }[] = [];
    const r = resolveFont({ fontFamily: 'NonExistent Fancy', availableFamilies: ['Inter'], warn: (c,m)=>warnings.push({code:c,message:m}) });
    expect(r.substituted).toBe(true);
    expect(r.primary).toBeDefined();
    expect(fontStackToClass(r)).toMatch(/font-\[/);
    expect(warnings.find(w => w.code === 'FONT_SUBSTITUTED')).toBeTruthy();
  });

  test('uses provided font family when available (no substitution)', () => {
    const warnings: any[] = [];
    const r = resolveFont({ fontFamily: 'Inter', availableFamilies: ['Inter'], warn: (c,m)=>warnings.push({code:c,message:m}) });
    expect(r.substituted).toBe(false);
    expect(r.stack[0]).toBe('Inter');
    expect(warnings.length).toBe(0);
  });
});
