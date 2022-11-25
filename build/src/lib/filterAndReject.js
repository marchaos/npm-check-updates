"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fp_and_or_1 = require("fp-and-or");
const identity_1 = __importDefault(require("lodash/identity"));
const negate_1 = __importDefault(require("lodash/negate"));
const minimatch_1 = __importDefault(require("minimatch"));
const semver_utils_1 = require("semver-utils");
/**
 * Creates a filter function from a given filter string. Supports
 * strings, wildcards, comma-or-space-delimited lists, and regexes.
 *
 * @param [filterPattern]
 * @returns
 */
function composeFilter(filterPattern) {
    let predicate;
    // no filter
    if (!filterPattern) {
        predicate = identity_1.default;
    }
    // string
    else if (typeof filterPattern === 'string') {
        // RegExp string
        if (filterPattern[0] === '/' && filterPattern[filterPattern.length - 1] === '/') {
            const regexp = new RegExp(filterPattern.slice(1, -1));
            predicate = (dependencyName) => regexp.test(dependencyName);
        }
        // glob string
        else {
            const patterns = filterPattern.split(/[\s,]+/);
            predicate = (dependencyName) => {
                /** Returns true if the pattern matches an unscoped dependency name. */
                const matchUnscoped = (pattern) => (0, minimatch_1.default)(dependencyName, pattern);
                /** Returns true if the pattern matches a scoped dependency name. */
                const matchScoped = (pattern) => !pattern.includes('/') &&
                    dependencyName.includes('/') &&
                    (0, minimatch_1.default)(dependencyName.replace(/\//g, '_'), pattern);
                // return true if any of the provided patterns match the dependency name
                return patterns.some((0, fp_and_or_1.or)(matchUnscoped, matchScoped));
            };
        }
    }
    // array
    else if (Array.isArray(filterPattern)) {
        predicate = (dependencyName, versionSpec) => filterPattern.some((subpattern) => composeFilter(subpattern)(dependencyName, versionSpec));
    }
    // raw RegExp
    else if (filterPattern instanceof RegExp) {
        predicate = (dependencyName) => filterPattern.test(dependencyName);
    }
    // function
    else if (typeof filterPattern === 'function') {
        predicate = (dependencyName, versionSpec) => filterPattern(dependencyName, (0, semver_utils_1.parseRange)(versionSpec !== null && versionSpec !== void 0 ? versionSpec : dependencyName));
    }
    else {
        throw new TypeError('Invalid filter. Must be a RegExp, array, or comma-or-space-delimited list.');
    }
    // limit the arity to 1 to avoid passing the value
    return predicate;
}
/**
 * Composes a filter function from filter, reject, filterVersion, and rejectVersion patterns.
 *
 * @param [filter]
 * @param [reject]
 * @param [filterVersion]
 * @param [rejectVersion]
 */
function filterAndReject(filter, reject, filterVersion, rejectVersion) {
    return (0, fp_and_or_1.and)(
    // filter dep
    (dependencyName, version) => (0, fp_and_or_1.and)(filter ? composeFilter(filter) : identity_1.default, reject ? (0, negate_1.default)(composeFilter(reject)) : identity_1.default)(dependencyName, version), 
    // filter version
    (dependencyName, version) => (0, fp_and_or_1.and)(filterVersion ? composeFilter(filterVersion) : identity_1.default, rejectVersion ? (0, negate_1.default)(composeFilter(rejectVersion)) : identity_1.default)(version));
}
exports.default = filterAndReject;
//# sourceMappingURL=filterAndReject.js.map