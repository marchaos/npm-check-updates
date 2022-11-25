"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterPredicate = exports.satisfiesPeerDependencies = exports.satisfiesNodeEngine = exports.allowPreOrIsNotPre = exports.allowDeprecatedOrIsNotDeprecated = void 0;
const get_1 = __importDefault(require("lodash/get"));
const overEvery_1 = __importDefault(require("lodash/overEvery"));
const semver_1 = __importDefault(require("semver"));
const versionUtil = __importStar(require("../lib/version-util"));
/**
 * @param versionResult  Available version
 * @param options     Options
 * @returns         True if deprecated versions are allowed or the version is not deprecated
 */
function allowDeprecatedOrIsNotDeprecated(versionResult, options) {
    if (options.deprecated)
        return true;
    return !versionResult.deprecated;
}
exports.allowDeprecatedOrIsNotDeprecated = allowDeprecatedOrIsNotDeprecated;
/**
 * @param versionResult  Available version
 * @param options     Options
 * @returns         True if pre-releases are allowed or the version is not a pre-release
 */
function allowPreOrIsNotPre(versionResult, options) {
    if (options.pre)
        return true;
    return !versionUtil.isPre(versionResult.version);
}
exports.allowPreOrIsNotPre = allowPreOrIsNotPre;
/**
 * Returns true if the node engine requirement is satisfied or not specified for a given package version.
 *
 * @param versionResult     Version object returned by pacote.packument.
 * @param nodeEngineVersion The value of engines.node in the package file.
 * @returns                 True if the node engine requirement is satisfied or not specified.
 */
function satisfiesNodeEngine(versionResult, nodeEngineVersion) {
    if (!nodeEngineVersion)
        return true;
    const minVersion = (0, get_1.default)(semver_1.default.minVersion(nodeEngineVersion), 'version');
    if (!minVersion)
        return true;
    const versionNodeEngine = (0, get_1.default)(versionResult, 'engines.node');
    return !!versionNodeEngine && semver_1.default.satisfies(minVersion, versionNodeEngine);
}
exports.satisfiesNodeEngine = satisfiesNodeEngine;
/**
 * Returns true if the peer dependencies requirement is satisfied or not specified for a given package version.
 *
 * @param versionResult     Version object returned by pacote.packument.
 * @param peerDependencies  The list of peer dependencies.
 * @returns                 True if the peer dependencies are satisfied or not specified.
 */
function satisfiesPeerDependencies(versionResult, peerDependencies) {
    if (!peerDependencies)
        return true;
    return Object.values(peerDependencies).every(peers => peers[versionResult.name] === undefined || semver_1.default.satisfies(versionResult.version, peers[versionResult.name]));
}
exports.satisfiesPeerDependencies = satisfiesPeerDependencies;
/** Returns a composite predicate that filters out deprecated, prerelease, and node engine incompatibilies from version objects returns by pacote.packument. */
function filterPredicate(options) {
    return (0, overEvery_1.default)([
        o => allowDeprecatedOrIsNotDeprecated(o, options),
        o => allowPreOrIsNotPre(o, options),
        options.enginesNode ? o => satisfiesNodeEngine(o, options.nodeEngineVersion) : null,
        options.peerDependencies ? o => satisfiesPeerDependencies(o, options.peerDependencies) : null,
    ]);
}
exports.filterPredicate = filterPredicate;
//# sourceMappingURL=filters.js.map