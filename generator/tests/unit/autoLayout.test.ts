import { describe, expect, it } from '@jest/globals';
import { mapAutoLayout } from '../../src/layout/autoLayout';

describe('auto layout mapping edge cases', () => {
  it('rounds fractional gaps and asymmetric padding to px utilities', () => {
    const { classes } = mapAutoLayout({
      direction: 'HORIZONTAL',
      gap: 3.6,
      alignItems: 'MAX',
      justifyContent: 'CENTER',
      padding: { top: 0, right: 2.2, bottom: 4.8, left: 0 }
    });

    expect(classes).toEqual(
      expect.arrayContaining(['flex', 'flex-row', 'gap-[4px]', 'items-end', 'justify-center', 'pr-[2px]', 'pb-[5px]'])
    );
    expect(classes).not.toContain('pt-[0px]');
    expect(classes).not.toContain('pl-[0px]');
  });

  it('emits gap-0 when direction is omitted but spacing requested', () => {
    const { classes } = mapAutoLayout({ gap: 0 });
    expect(classes).toContain('gap-0');
    expect(classes).not.toContain('flex');
  });

  it('ignores unsupported alignment tokens', () => {
    const { classes } = mapAutoLayout({
      direction: 'VERTICAL',
      alignItems: 'BASELINE' as any,
      justifyContent: 'SPACE_AROUND' as any
    });

    expect(classes).toEqual(expect.arrayContaining(['flex', 'flex-col']));
    expect(classes).not.toContain('items-baseline');
    expect(classes).not.toContain('justify-around');
  });
});
