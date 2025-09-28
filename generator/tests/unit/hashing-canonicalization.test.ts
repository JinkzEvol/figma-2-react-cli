import { canonicalize, canonicalSerialize } from '../../src/hashing/canonical';
import { hashContent } from '../../src/hashing/sha1';

describe('hash canonicalization edge cases', () => {
  test('whitespace collapse & float rounding equivalence', () => {
    const a = canonicalize({ text: 'Hello   World', value: 1.234567 });
    const b = canonicalSerialize({ value: 1.2345671, text: 'Hello World' });
    expect(a).toEqual(b);
    expect(hashContent(a)).toEqual(hashContent(b));
  });

  test('null & undefined omission equality', () => {
    const a = canonicalize({ a: 1, b: null, c: undefined, d: [1, 2, null] });
    const b = canonicalize({ d: [1, 2], a: 1 });
    expect(a).toEqual(b);
  });

  test('array order preserved distinct from sorted object keys', () => {
    const a = canonicalize({ arr: [2, 1], obj: { b: 1, a: 1 } });
    const b = canonicalize({ obj: { a: 1, b: 1 }, arr: [2, 1] });
    expect(a).toEqual(b); // key sort reorders object keys but not array sequence
  });
});
