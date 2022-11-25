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
const chai_1 = __importStar(require("chai"));
const chai_string_1 = __importDefault(require("chai-string"));
const promises_1 = __importDefault(require("fs/promises"));
const rimraf_1 = __importDefault(require("rimraf"));
const ncu = __importStar(require("../src/"));
const cache_1 = require("../src/lib/cache");
chai_1.default.should();
chai_1.default.use(chai_string_1.default);
process.env.NCU_TESTS = 'true';
describe('cache', () => {
    it('cache latest versions', async () => {
        try {
            const packageData = {
                dependencies: {
                    // major version upgrade → 2.0.0
                    'ncu-test-v2': '^1.0.0',
                    // latest: minor version upgrade → 1.1.0
                    // greatest: prerelease → 1.2.0-dev.0
                    'ncu-test-tag': '1.0.0',
                    // latest: no upgrade
                    // greatest: prerelease → 2.0.0-alpha.2
                    'ncu-test-alpha': '1.0.0',
                },
            };
            await ncu.run({ packageData, cache: true });
            const cacheData = await promises_1.default.readFile(cache_1.resolvedDefaultCacheFile, 'utf-8').then(JSON.parse);
            (0, chai_1.expect)(cacheData.timestamp).lessThanOrEqual(Date.now());
            (0, chai_1.expect)(cacheData.packages).deep.eq({
                [`ncu-test-v2${cache_1.CACHE_DELIMITER}latest`]: '2.0.0',
                [`ncu-test-tag${cache_1.CACHE_DELIMITER}latest`]: '1.1.0',
                [`ncu-test-alpha${cache_1.CACHE_DELIMITER}latest`]: '1.0.0',
            });
        }
        finally {
            rimraf_1.default.sync(cache_1.resolvedDefaultCacheFile);
        }
    });
    it('use different cache key for different target', async () => {
        try {
            const packageData = {
                dependencies: {
                    // major version upgrade → 2.0.0
                    'ncu-test-v2': '^1.0.0',
                    // minor version upgrade → 1.1.0
                    'ncu-test-tag': '1.0.0',
                    // latest: no upgrade
                    // greatest: prerelease → 2.0.0.alpha.2
                    'ncu-test-alpha': '1.0.0',
                },
            };
            // first run caches latest
            await ncu.run({ packageData, cache: true });
            const cacheData1 = await promises_1.default.readFile(cache_1.resolvedDefaultCacheFile, 'utf-8').then(JSON.parse);
            (0, chai_1.expect)(cacheData1.packages).deep.eq({
                [`ncu-test-v2${cache_1.CACHE_DELIMITER}latest`]: '2.0.0',
                [`ncu-test-tag${cache_1.CACHE_DELIMITER}latest`]: '1.1.0',
                [`ncu-test-alpha${cache_1.CACHE_DELIMITER}latest`]: '1.0.0',
            });
            // second run has a different target so should not use the cache
            const result2 = await ncu.run({ packageData, cache: true, target: 'greatest' });
            (0, chai_1.expect)(result2).deep.eq({
                'ncu-test-v2': '^2.0.0',
                'ncu-test-tag': '1.2.0-dev.0',
                'ncu-test-alpha': '2.0.0-alpha.2',
            });
            const cacheData2 = await promises_1.default.readFile(cache_1.resolvedDefaultCacheFile, 'utf-8').then(JSON.parse);
            (0, chai_1.expect)(cacheData2.packages).deep.eq({
                [`ncu-test-v2${cache_1.CACHE_DELIMITER}latest`]: '2.0.0',
                [`ncu-test-tag${cache_1.CACHE_DELIMITER}latest`]: '1.1.0',
                [`ncu-test-alpha${cache_1.CACHE_DELIMITER}latest`]: '1.0.0',
                [`ncu-test-v2${cache_1.CACHE_DELIMITER}greatest`]: '2.0.0',
                [`ncu-test-tag${cache_1.CACHE_DELIMITER}greatest`]: '1.2.0-dev.0',
                [`ncu-test-alpha${cache_1.CACHE_DELIMITER}greatest`]: '2.0.0-alpha.2',
            });
        }
        finally {
            rimraf_1.default.sync(cache_1.resolvedDefaultCacheFile);
        }
    });
    it('clears the cache file', async () => {
        const packageData = {
            dependencies: {
                // major version upgrade → 2.0.0
                'ncu-test-v2': '^1.0.0',
                // latest: minor version upgrade → 1.1.0
                // greatest: prerelease → 1.2.0-dev.0
                'ncu-test-tag': '1.0.0',
                // latest: no upgrade
                // greatest: prerelease → 2.0.0-alpha.2
                'ncu-test-alpha': '1.0.0',
            },
        };
        await ncu.run({ packageData, cache: true });
        await ncu.run({ packageData, cacheClear: true });
        let noCacheFile = false;
        try {
            await promises_1.default.stat(cache_1.resolvedDefaultCacheFile);
        }
        catch (error) {
            noCacheFile = true;
        }
        (0, chai_1.expect)(noCacheFile).eq(true);
    });
});
//# sourceMappingURL=cache.test.js.map