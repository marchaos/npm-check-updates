"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.latest = void 0;
const fast_memoize_1 = __importDefault(require("fast-memoize"));
const promises_1 = __importDefault(require("fs/promises"));
/**
 * Returns registry object given a valid path
 *
 * @param path
 * @returns a registry object
 */
const readStaticRegistry = async (path) => JSON.parse(await promises_1.default.readFile(path, 'utf8'));
const registryMemoized = (0, fast_memoize_1.default)(readStaticRegistry);
/**
 * Fetches the version in static registry.
 *
 * @param packageName
 * @param currentVersion
 * @param options
 * @returns A promise that fulfills to string value or null
 */
const latest = async (packageName, currentVersion, options = {}) => {
    const registry = await registryMemoized(options.registry);
    return registry[packageName] || null;
};
exports.latest = latest;
//# sourceMappingURL=staticRegistry.js.map