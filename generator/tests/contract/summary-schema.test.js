"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const schemaUtils_1 = require("./schemaUtils");
(0, globals_1.describe)('contract: summary schema', () => {
    const ajv = (0, schemaUtils_1.createAjv)();
    (0, globals_1.it)('validates emitted summary.json structure (currently failing stub)', () => {
        const schema = (0, schemaUtils_1.readSchema)('summary.schema.json');
        const validate = ajv.compile(schema);
        // TODO: replace stub with actual generator summary once emission pipeline exists.
        const stubSummary = {
            layerCount: 1,
            componentCount: 1,
            assetCount: 0,
            warningCount: 0
            // Missing required fields like warningCap, timings, versionDir, etc.
        };
        const isValid = validate(stubSummary);
        // Expecting failure until summary builder is implemented.
        (0, globals_1.expect)(isValid).toBe(true);
    });
});
//# sourceMappingURL=summary-schema.test.js.map