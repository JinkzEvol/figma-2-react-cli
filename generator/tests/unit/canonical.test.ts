import { describe, expect, it } from '@jest/globals';
import { canonicalize } from '../../src/hashing/canonical';
import { hashContent } from '../../src/hashing/sha1';

describe('canonical serializer edge cases', () => {
  it('normalizes deeply nested structures regardless of key ordering', () => {
    const valueA = {
      z: [
        { foo: 'bar', baz: 1 },
        { foo: 'bar', baz: 1 }
      ],
      a: {
        y: 1,
        x: 2
      }
    };
    const valueB = {
      a: {
        x: 2.0000001,
        y: 1
      },
      z: [
        { baz: 1.00000001, foo: 'bar' },
        { foo: 'bar', baz: 1 }
      ]
    };

    const serializedA = canonicalize(valueA);
    const serializedB = canonicalize(valueB);
    expect(serializedA).toEqual(serializedB);
    expect(hashContent(serializedA)).toEqual(hashContent(serializedB));
  });

  it('represents special numeric values as stable tokens', () => {
    const serialized = canonicalize({
      positiveInfinity: Infinity,
      negativeInfinity: -Infinity,
      notANumber: Number.NaN
    });

    expect(serialized).toContain('"positiveInfinity":"Infinity"');
    expect(serialized).toContain('"negativeInfinity":"-Infinity"');
    expect(serialized).toContain('"notANumber":"NaN"');
  });

  it('collapses whitespace within string arrays and strips undefined entries', () => {
    const value = ['  spaced\n string\t', undefined, ' spaced   string '];
    const serialized = canonicalize(value);
    expect(serialized).toBe('["spaced string","spaced string"]');
  });

  it('replaces circular references with null placeholders to stay deterministic', () => {
    const node: any = { id: 'root' };
    node.self = node;
    const payload = { node, list: [node, { id: 'child' }] };

    const serialized = canonicalize(payload);
    expect(serialized).toContain('"self":null');
    expect(() => JSON.parse(serialized)).not.toThrow();
  });
});
