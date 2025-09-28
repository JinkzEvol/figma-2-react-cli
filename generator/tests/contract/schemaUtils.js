"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readSchema = readSchema;
exports.createAjv = createAjv;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const ajv_1 = __importDefault(require("ajv"));
const ajv_formats_1 = __importDefault(require("ajv-formats"));
const featureDir = (() => {
    if (process.env.FEATURE_DIR) {
        return node_path_1.default.resolve(process.env.FEATURE_DIR);
    }
    return node_path_1.default.resolve(__dirname, '../../..', 'specs', '001-deterministic-figma-to');
})();
const contractsDir = node_path_1.default.join(featureDir, 'contracts');
function readSchema(schemaFile) {
    const targetPath = node_path_1.default.join(contractsDir, schemaFile);
    const schemaRaw = node_fs_1.default.readFileSync(targetPath, 'utf-8');
    return JSON.parse(schemaRaw);
}
function createAjv(options = {}) {
    const ajv = new ajv_1.default({ allErrors: true, strict: false, ...options });
    (0, ajv_formats_1.default)(ajv);
    return ajv;
}
//# sourceMappingURL=schemaUtils.js.map