"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const canonical_1 = require("../../src/hashing/canonical");
const sha1_1 = require("../../src/hashing/sha1");
/**
 * Basic tests for canonical serializer (T021) – edge cases deferred to T055/T063.
 */
describe('canonical serializer basic', () => {
    test('stable key ordering & whitespace collapse', () => {
        const a = { b: 2, a: ' Hello   world  ' };
        const b = { a: 'Hello world', b: 2.0000001 };
        const ca = (0, canonical_1.canonicalize)(a);
        const cb = (0, canonical_1.canonicalSerialize)(b); // alias should behave identically
        expect(ca).toEqual(cb);
        // Hash prefix consistency
        expect((0, sha1_1.hashContent)(ca)).toEqual((0, sha1_1.hashContent)(cb));
    });
    test('omit null & undefined properties', () => {
        const a = { a: 1, b: null, c: undefined, d: 2 };
        const b = { d: 2.0, a: 1.00000001 };
        expect((0, canonical_1.canonicalize)(a)).toEqual((0, canonical_1.canonicalize)(b));
    });
    test('array element processing and number rounding', () => {
        const c1 = (0, canonical_1.canonicalize)([1.2345678, 1.23456001]);
        const c2 = (0, canonical_1.canonicalize)([1.2346, 1.23456]);
        expect(c1).toEqual(c2);
    });
});
//# sourceMappingURL=canonical-basic.test.js.map