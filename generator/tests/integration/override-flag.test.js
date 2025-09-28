"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
/**
 * T016 Integration test override flag audit (scaffold)
 * EXPECTED INITIAL STATE: Fails until pipeline implemented.
 * Goal: Running pipeline with --ignore-warning-threshold sets summary.overrideUsed=true and summary.overrideNotice present.
 */
(0, globals_1.describe)('integration: override flag audit', () => {
    (0, globals_1.test)('sets overrideUsed and overrideNotice in summary', async () => {
        // TODO: invoke future runPipeline helper with override flag once override handling exists.
        throw new Error('TODO: implement override flag audit test once summary builder records overrides.');
    });
});
//# sourceMappingURL=override-flag.test.js.map