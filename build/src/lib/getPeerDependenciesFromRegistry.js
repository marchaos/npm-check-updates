"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const progress_1 = __importDefault(require("progress"));
const getPackageManager_1 = __importDefault(require("./getPackageManager"));
/**
 * Get the latest or greatest versions from the NPM repository based on the version target.
 *
 * @param packageMap   An object whose keys are package name and values are version
 * @param [options={}] Options.
 * @returns Promised {packageName: peer dependencies} collection
 */
async function getPeerDependenciesFromRegistry(packageMap, options) {
    const packageManager = (0, getPackageManager_1.default)(options.packageManager);
    if (!packageManager.getPeerDependencies)
        return {};
    const numItems = Object.keys(packageMap).length;
    let bar;
    if (!options.json && options.loglevel !== 'silent' && options.loglevel !== 'verbose' && numItems > 0) {
        bar = new progress_1.default('[:bar] :current/:total :percent', { total: numItems, width: 20 });
        bar.render();
    }
    return Object.entries(packageMap).reduce(async (accumPromise, [pkg, version]) => {
        const dep = await packageManager.getPeerDependencies(pkg, version);
        if (bar) {
            bar.tick();
        }
        const accum = await accumPromise;
        return { ...accum, [pkg]: dep };
    }, {});
}
exports.default = getPeerDependenciesFromRegistry;
//# sourceMappingURL=getPeerDependenciesFromRegistry.js.map