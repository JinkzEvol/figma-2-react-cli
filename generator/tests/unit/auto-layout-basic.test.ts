import { mapAutoLayout } from '../../src/layout/autoLayout';

describe('auto layout basic', () => {
  test('horizontal gap center justification', () => {
    const { classes } = mapAutoLayout({ direction: 'HORIZONTAL', gap: 12, alignItems: 'CENTER', justifyContent: 'SPACE_BETWEEN', padding: { top: 8, right: 8, bottom: 8, left: 8 } });
    expect(classes).toContain('flex');
    expect(classes).toContain('flex-row');
    expect(classes).toContain('gap-[12px]');
    expect(classes).toContain('items-center');
    expect(classes).toContain('justify-between');
    expect(classes).toContain('p-[8px]');
  });

  test('vertical no gap asymmetric padding', () => {
    const { classes } = mapAutoLayout({ direction: 'VERTICAL', gap: 0, alignItems: 'MIN', justifyContent: 'MAX', padding: { top: 4, right: 8, bottom: 4, left: 2 } });
    expect(classes).toEqual(expect.arrayContaining(['flex', 'flex-col', 'gap-0', 'items-start', 'justify-end', 'pt-[4px]', 'pr-[8px]', 'pb-[4px]', 'pl-[2px]']));
  });
});
