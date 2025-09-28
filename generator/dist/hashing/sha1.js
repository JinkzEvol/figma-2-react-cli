"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashContent = hashContent;
const crypto_1 = require("crypto");
/**
 * Deterministic SHA-1 based hash utility returning first 8 hex chars (collision window acceptable per spec).
 */
function hashContent(input) {
    const hash = (0, crypto_1.createHash)('sha1');
    if (typeof input === 'string') {
        hash.update(Buffer.from(input, 'utf8'));
    }
    else {
        hash.update(input);
    }
    return hash.digest('hex').slice(0, 8);
}
//# sourceMappingURL=sha1.js.map