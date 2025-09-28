import { diffLayout } from '../../src/layout/diff';

describe('integration: fidelity diff gate', () => {
  test('geometry deltas beyond 1px cause failure (simulated)', () => {
    const expected = { root: { width: 100, height: 50 } };
    const actual = { root: { width: 102.2, height: 50 } }; // width delta > 1
    const res = diffLayout(expected, actual, 1);
    expect(res.issues.length).toBe(1);
    expect(res.issues[0].field).toBe('width');
  });
});
