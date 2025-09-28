"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const schemaUtils_1 = require("./schemaUtils");
(0, globals_1.describe)('contract: version-map schema', () => {
    const ajv = (0, schemaUtils_1.createAjv)();
    (0, globals_1.it)('validates emitted version-map.json structure (currently failing stub)', () => {
        const schema = (0, schemaUtils_1.readSchema)('version-map.schema.json');
        const validate = ajv.compile(schema);
        // TODO: replace stub with version map produced by pipeline once available.
        const stubVersionMap = {
            baseComponent: 'HeroSection'
            // Missing required fields like versionDir, runTimestamp, fileHashes.
        };
        const isValid = validate(stubVersionMap);
        (0, globals_1.expect)(isValid).toBe(true);
    });
});
//# sourceMappingURL=version-map-schema.test.js.map