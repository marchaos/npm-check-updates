"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheClear = exports.resolveCacheFile = exports.resolvedDefaultCacheFile = exports.defaultCacheFile = exports.defaultCacheFilename = exports.CACHE_DELIMITER = void 0;
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const logging_1 = require("./logging");
exports.CACHE_DELIMITER = '___';
/**
 * Check if cache is expired if timestamp is set
 *
 * @param cacheData
 * @param cacheExpiration
 * @returns
 */
function checkCacheExpiration(cacheData, cacheExpiration = 10) {
    if (typeof cacheData.timestamp !== 'number') {
        return false;
    }
    const unixMinuteMS = 60 * 1000;
    const expirationLimit = cacheData.timestamp + cacheExpiration * unixMinuteMS;
    return expirationLimit < Date.now();
}
exports.defaultCacheFilename = '.ncu-cache.json';
exports.defaultCacheFile = `~/${exports.defaultCacheFilename}`;
exports.resolvedDefaultCacheFile = path_1.default.join(os_1.default.homedir(), exports.defaultCacheFilename);
/** Resolve the cache file path based on os/homedir. */
function resolveCacheFile(optionsCacheFile) {
    return optionsCacheFile === exports.defaultCacheFile ? exports.resolvedDefaultCacheFile : optionsCacheFile;
}
exports.resolveCacheFile = resolveCacheFile;
/** Clear the default cache, or the cache file specified by --cacheFile. */
async function cacheClear(options) {
    if (!options.cacheFile) {
        return;
    }
    await fs_1.default.promises.rm(resolveCacheFile(options.cacheFile), { force: true });
}
exports.cacheClear = cacheClear;
/**
 * The cacher stores key (name + target) - value (new version) pairs
 * for quick updates across `ncu` calls.
 *
 * @returns
 */
async function cacher(options) {
    if (!options.cache || !options.cacheFile) {
        return;
    }
    const cacheFile = resolveCacheFile(options.cacheFile);
    let cacheData = {};
    const cacheUpdates = {};
    try {
        cacheData = JSON.parse(await fs_1.default.promises.readFile(cacheFile, 'utf-8'));
        const expired = checkCacheExpiration(cacheData, options.cacheExpiration);
        if (expired) {
            // reset cache
            fs_1.default.promises.rm(cacheFile, { force: true });
            cacheData = {};
        }
    }
    catch (error) {
        // ignore file read/parse/remove errors
    }
    if (typeof cacheData.timestamp !== 'number') {
        cacheData.timestamp = Date.now();
    }
    if (!cacheData.packages) {
        cacheData.packages = {};
    }
    return {
        get: (name, target) => {
            const key = `${name}${exports.CACHE_DELIMITER}${target}`;
            if (!key || !cacheData.packages)
                return;
            const cached = cacheData.packages[key];
            if (cached && !key.includes(cached)) {
                const [name] = key.split(exports.CACHE_DELIMITER);
                cacheUpdates[name] = cached;
            }
            return cached;
        },
        set: (name, target, version) => {
            const key = `${name}${exports.CACHE_DELIMITER}${target}`;
            if (!key || !cacheData.packages)
                return;
            cacheData.packages[key] = version;
        },
        save: async () => {
            await fs_1.default.promises.writeFile(cacheFile, JSON.stringify(cacheData));
        },
        log: () => {
            const cacheCount = Object.keys(cacheUpdates).length;
            if (cacheCount === 0)
                return;
            (0, logging_1.print)(options, `\nUsing ${cacheCount} cached package versions`, 'warn');
            (0, logging_1.print)(options, cacheUpdates, 'verbose');
        },
    };
}
exports.default = cacher;
//# sourceMappingURL=cache.js.map