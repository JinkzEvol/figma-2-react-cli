import { canonicalize, canonicalSerialize } from '../../src/hashing/canonical';
import { hashContent } from '../../src/hashing/sha1';

/**
 * Basic tests for canonical serializer (T021) – edge cases deferred to T055/T063.
 */

describe('canonical serializer basic', () => {
  test('stable key ordering & whitespace collapse', () => {
    const a = { b: 2, a: ' Hello   world  ' };
    const b = { a: 'Hello world', b: 2.0000001 };
    const ca = canonicalize(a);
    const cb = canonicalSerialize(b); // alias should behave identically
    expect(ca).toEqual(cb);
    // Hash prefix consistency
    expect(hashContent(ca)).toEqual(hashContent(cb));
  });

  test('omit null & undefined properties', () => {
    const a: any = { a: 1, b: null, c: undefined, d: 2 };
    const b: any = { d: 2.0, a: 1.00000001 };
    expect(canonicalize(a)).toEqual(canonicalize(b));
  });

  test('array element processing and number rounding', () => {
    const c1 = canonicalize([1.2345678, 1.23456001]);
    const c2 = canonicalize([1.2346, 1.23456]);
    expect(c1).toEqual(c2);
  });
});
