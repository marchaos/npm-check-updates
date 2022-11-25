"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upgradePackageDefinitions = void 0;
const isEmpty_1 = __importDefault(require("lodash/isEmpty"));
const isEqual_1 = __importDefault(require("lodash/isEqual"));
const pickBy_1 = __importDefault(require("lodash/pickBy"));
const semver_1 = require("semver");
const getPeerDependenciesFromRegistry_1 = __importDefault(require("./getPeerDependenciesFromRegistry"));
const keyValueBy_1 = __importDefault(require("./keyValueBy"));
const queryVersions_1 = __importDefault(require("./queryVersions"));
const upgradeDependencies_1 = __importDefault(require("./upgradeDependencies"));
/**
 * Returns a 3-tuple of upgradedDependencies, their latest versions and the resulting peer dependencies.
 *
 * @param currentDependencies
 * @param options
 * @returns
 */
async function upgradePackageDefinitions(currentDependencies, options) {
    const latestVersionResults = await (0, queryVersions_1.default)(currentDependencies, options);
    const latestVersions = (0, keyValueBy_1.default)(latestVersionResults, (dep, result) => (result === null || result === void 0 ? void 0 : result.version)
        ? {
            [dep]: result.version,
        }
        : null);
    const upgradedDependencies = (0, upgradeDependencies_1.default)(currentDependencies, latestVersions, {
        removeRange: options.removeRange,
    });
    const filteredUpgradedDependencies = (0, pickBy_1.default)(upgradedDependencies, (v, dep) => {
        return !options.jsonUpgraded || !options.minimal || !(0, semver_1.satisfies)(latestVersions[dep], currentDependencies[dep]);
    });
    if (options.peer && !(0, isEmpty_1.default)(filteredUpgradedDependencies)) {
        const upgradedPeerDependencies = await (0, getPeerDependenciesFromRegistry_1.default)(filteredUpgradedDependencies, options);
        const peerDependencies = { ...options.peerDependencies, ...upgradedPeerDependencies };
        if (!(0, isEqual_1.default)(options.peerDependencies, peerDependencies)) {
            const [newUpgradedDependencies, newLatestVersions, newPeerDependencies] = await upgradePackageDefinitions({ ...currentDependencies, ...filteredUpgradedDependencies }, { ...options, peerDependencies, loglevel: 'silent' });
            return [
                { ...filteredUpgradedDependencies, ...newUpgradedDependencies },
                { ...latestVersionResults, ...newLatestVersions },
                newPeerDependencies,
            ];
        }
    }
    return [filteredUpgradedDependencies, latestVersionResults, options.peerDependencies];
}
exports.upgradePackageDefinitions = upgradePackageDefinitions;
exports.default = upgradePackageDefinitions;
//# sourceMappingURL=upgradePackageDefinitions.js.map