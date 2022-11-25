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
const semver = __importStar(require("semver"));
const semver_utils_1 = __importDefault(require("semver-utils"));
const version_util_1 = require("./version-util");
/**
 * Check if a version satisfies the latest, and is not beyond the latest). Ignores `v` prefix.
 *
 * @param current
 * @param latest
 * @returns
 */
function isUpgradeable(current, latest) {
    // do not upgrade non-npm version declarations (such as git tags)
    // do not upgrade wildcards
    if (!semver.validRange(current) || (0, version_util_1.isWildCard)(current)) {
        return false;
    }
    // remove the constraint (e.g. ^1.0.1 -> 1.0.1) to allow upgrades that satisfy the range, but are out of date
    const [range] = semver_utils_1.default.parseRange(current);
    if (!range) {
        throw new Error(`"${current}" could not be parsed by semver-utils. This is probably a bug. Please file an issue at https://github.com/raineorshine/npm-check-updates.`);
    }
    // allow upgrading of pseudo versions such as "v1" or "1.0"
    const latestNormalized = (0, version_util_1.fixPseudoVersion)(latest);
    const version = (0, version_util_1.stringify)(range);
    const isValidCurrent = Boolean(semver.validRange(version));
    const isValidLatest = Boolean(semver.valid(latestNormalized));
    // make sure it is a valid range
    // not upgradeable if the latest version satisfies the current range
    // not upgradeable if the specified version is newer than the latest (indicating a prerelease version)
    // NOTE: When "<" is specified with a single digit version, e.g. "<7", and has the same major version as the latest, e.g. "7", isSatisfied(latest, version) will return true since it ignores the "<". In this case, test the original range (current) rather than the versionUtil output (version).
    return (isValidCurrent &&
        isValidLatest &&
        // allow an upgrade if two prerelease versions can't be compared by semver
        (!(0, version_util_1.isComparable)(latestNormalized, version) ||
            (!semver.satisfies(latestNormalized, range.operator === '<' ? current : version) &&
                !semver.ltr(latestNormalized, version))));
}
exports.default = isUpgradeable;
//# sourceMappingURL=isUpgradeable.js.map