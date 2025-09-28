"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const schemaUtils_1 = require("./schemaUtils");
(0, globals_1.describe)('contract: trace schema', () => {
    const ajv = (0, schemaUtils_1.createAjv)();
    (0, globals_1.it)('validates emitted trace.json structure (currently failing stub)', () => {
        const schema = (0, schemaUtils_1.readSchema)('trace.schema.json');
        const validate = ajv.compile(schema);
        // TODO: replace stub once trace builder is implemented.
        const stubTrace = [
            {
                layerId: '1:2',
                layerName: 'Root Frame'
                // Missing required fields like type & actions array.
            }
        ];
        const isValid = validate(stubTrace);
        (0, globals_1.expect)(isValid).toBe(true);
    });
});
//# sourceMappingURL=trace-schema.test.js.map