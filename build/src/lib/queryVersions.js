"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const p_map_1 = __importDefault(require("p-map"));
const progress_1 = __importDefault(require("progress"));
const semver_utils_1 = require("semver-utils");
const package_managers_1 = __importDefault(require("../package-managers"));
const getPackageManager_1 = __importDefault(require("./getPackageManager"));
const keyValueBy_1 = __importDefault(require("./keyValueBy"));
const version_util_1 = require("./version-util");
const supportedVersionTargets = ['latest', 'newest', 'greatest', 'minor', 'patch'];
/**
 * Get the latest or greatest versions from the NPM repository based on the version target.
 *
 * @param packageMap   An object whose keys are package name and values are current versions. May include npm aliases, i.e. { "package": "npm:other-package@1.0.0" }
 * @param [options={}] Options. Default: { target: 'latest' }.
 * @returns Promised {packageName: version} collection
 */
async function queryVersions(packageMap, options = {}) {
    var _a, _b;
    const { default: chalkDefault, Chalk } = await import('chalk');
    const chalk = options.color ? new Chalk({ level: 1 }) : chalkDefault;
    const packageList = Object.keys(packageMap);
    const globalPackageManager = (0, getPackageManager_1.default)(options.packageManager);
    let bar;
    if (!options.json && options.loglevel !== 'silent' && options.loglevel !== 'verbose' && packageList.length > 0) {
        bar = new progress_1.default('[:bar] :current/:total :percent', { total: packageList.length, width: 20 });
        bar.render();
    }
    /**
     * Ignore 404 errors from getPackageVersion by having them return `null`
     * instead of rejecting.
     *
     * @param dep
     * @returns
     */
    async function getPackageVersionProtected(dep) {
        var _a, _b, _c;
        const npmAlias = (0, version_util_1.parseNpmAlias)(packageMap[dep]);
        const [name, version] = npmAlias || [dep, packageMap[dep]];
        let distTag = 'latest';
        const targetOption = options.target || 'latest';
        let target = typeof targetOption === 'string' ? targetOption : targetOption(name, (0, semver_utils_1.parseRange)(version));
        if (target[0] === '@') {
            distTag = target.slice(1);
            target = 'distTag';
        }
        const cached = (_a = options.cacher) === null || _a === void 0 ? void 0 : _a.get(name, target);
        if (cached) {
            bar === null || bar === void 0 ? void 0 : bar.tick();
            return {
                version: cached,
            };
        }
        let versionNew = null;
        const isGithubDependency = (0, version_util_1.isGithubUrl)(packageMap[dep]);
        // use gitTags package manager for git urls (for this dependency only)
        const packageManager = isGithubDependency ? package_managers_1.default.gitTags : globalPackageManager;
        const packageManagerName = isGithubDependency ? 'github urls' : options.packageManager || 'npm';
        const getPackageVersion = packageManager[target];
        if (!getPackageVersion) {
            const packageManagerSupportedVersionTargets = supportedVersionTargets.filter(t => t in packageManager);
            return Promise.reject(new Error(`Unsupported target "${target}" for ${packageManagerName}. Supported version targets are: ` +
                packageManagerSupportedVersionTargets.join(', ') +
                (!isGithubDependency ? ' and custom distribution tags, following "@" (example: @next)' : '')));
        }
        try {
            versionNew = await getPackageVersion(name, version, {
                ...options,
                distTag,
                // upgrade prereleases to newer prereleases by default
                pre: options.pre != null ? options.pre : distTag !== 'latest' || (0, version_util_1.isPre)(version),
                retry: (_b = options.retry) !== null && _b !== void 0 ? _b : 2,
            });
            versionNew = !isGithubDependency && npmAlias && versionNew ? (0, version_util_1.createNpmAlias)(name, versionNew) : versionNew;
        }
        catch (err) {
            const errorMessage = err ? (err.message || err).toString() : '';
            if (errorMessage.match(/E404|ENOTFOUND|404 Not Found/i)) {
                return {
                    error: `${errorMessage.replace(/ - Not found$/i, '')}. Either your internet connection is down or unstable and all ${options.retry} retry attempts failed, or the registry is not accessible, or the package does not exist.`,
                };
            }
            else {
                // print a hint about the --timeout option for network timeout errors
                if (!process.env.NCU_TESTS && /(Response|network) timeout/i.test(errorMessage)) {
                    console.error('\n\n' +
                        chalk.red('FetchError: Request Timeout. npm-registry-fetch defaults to 30000 (30 seconds). Try setting the --timeout option (in milliseconds) to override this.') +
                        '\n');
                }
                throw err;
            }
        }
        bar === null || bar === void 0 ? void 0 : bar.tick();
        if (versionNew) {
            (_c = options.cacher) === null || _c === void 0 ? void 0 : _c.set(name, target, versionNew);
        }
        return {
            version: versionNew,
        };
    }
    const versionResultList = await (0, p_map_1.default)(packageList, getPackageVersionProtected, { concurrency: options.concurrency });
    // save cacher only after pMap handles cacher.set
    await ((_a = options.cacher) === null || _a === void 0 ? void 0 : _a.save());
    (_b = options.cacher) === null || _b === void 0 ? void 0 : _b.log();
    const versionResultObject = (0, keyValueBy_1.default)(versionResultList, (versionResult, i) => versionResult.version || versionResult.error
        ? {
            [packageList[i]]: versionResult,
        }
        : null);
    return versionResultObject;
}
exports.default = queryVersions;
//# sourceMappingURL=queryVersions.js.map