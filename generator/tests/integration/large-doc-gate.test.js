"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
/**
 * T018 Large document gate test (scaffold)
 * Simulate pre-scan detecting large doc; decline then accept.
 */
(0, globals_1.describe)('integration: large document gate', () => {
    (0, globals_1.test)('decline path aborts without outputs', async () => {
        // TODO: invoke pre-scan module with decline scenario once CLI confirm hook exists.
        throw new Error('TODO: ensure decline path aborts outputs once large doc gate is implemented.');
    });
    (0, globals_1.test)('accept path proceeds with largeDocument flag', async () => {
        // TODO: invoke pre-scan module with acceptance scenario once pipeline is available.
        throw new Error('TODO: ensure acceptance path sets largeDocument flag once gate is implemented.');
    });
});
//# sourceMappingURL=large-doc-gate.test.js.map