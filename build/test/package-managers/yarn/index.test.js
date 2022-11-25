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
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
const path_1 = __importDefault(require("path"));
const yarn = __importStar(require("../../../src/package-managers/yarn"));
const yarn_1 = require("../../../src/package-managers/yarn");
chai_1.default.should();
chai_1.default.use(chai_as_promised_1.default);
process.env.NCU_TESTS = 'true';
const isWindows = process.platform === 'win32';
// append the local node_modules bin directory to process.env.PATH so local yarn is used during tests
const localBin = path_1.default.resolve(__dirname.replace('build/', ''), '../../../node_modules/.bin');
const localYarnSpawnOptions = {
    env: {
        ...process.env,
        PATH: `${process.env.PATH}:${localBin}`,
    },
};
describe('yarn', function () {
    it('list', async () => {
        const testDir = path_1.default.join(__dirname, 'default');
        const version = await yarn.latest('chalk', '', { cwd: testDir });
        parseInt(version, 10).should.be.above(3);
    });
    it('latest', async () => {
        const testDir = path_1.default.join(__dirname, 'default');
        const version = await yarn.latest('chalk', '', { cwd: testDir });
        parseInt(version, 10).should.be.above(3);
    });
    it('greatest', async () => {
        const version = await yarn.greatest('ncu-test-greatest-not-newest', '', { pre: true, cwd: __dirname });
        version.should.equal('2.0.0-beta');
    });
    it('avoids deprecated', async () => {
        const testDir = path_1.default.join(__dirname, 'default');
        const version = await yarn.minor('popper.js', '1.15.0', { cwd: testDir, pre: true });
        version.should.equal('1.16.1-lts');
    });
    it('"No lockfile" error should be thrown on list command when there is no lockfile', async () => {
        const testDir = path_1.default.join(__dirname, 'nolockfile');
        const lockFileErrorMessage = 'No lockfile in this directory. Run `yarn install` to generate one.';
        await yarn.list({ cwd: testDir }, localYarnSpawnOptions).should.eventually.be.rejectedWith(lockFileErrorMessage);
    });
    describe('npmAuthTokenKeyValue', () => {
        it('npmRegistryServer with trailing slash', () => {
            const authToken = yarn.npmAuthTokenKeyValue({}, 'fortawesome', {
                npmAlwaysAuth: true,
                npmAuthToken: 'MY-AUTH-TOKEN',
                npmRegistryServer: 'https://npm.fontawesome.com/',
            });
            authToken.should.deep.equal({
                '//npm.fontawesome.com/:_authToken': 'MY-AUTH-TOKEN',
            });
        });
        it('npmRegistryServer without trailing slash', () => {
            const authToken = yarn.npmAuthTokenKeyValue({}, 'fortawesome', {
                npmAlwaysAuth: true,
                npmAuthToken: 'MY-AUTH-TOKEN',
                npmRegistryServer: 'https://npm.fontawesome.com',
            });
            authToken.should.deep.equal({
                '//npm.fontawesome.com/:_authToken': 'MY-AUTH-TOKEN',
            });
        });
    });
});
describe('getPathToLookForLocalYarnrc', () => {
    it('returns the correct path when using Yarn workspaces', async () => {
        /** Mock for filesystem calls. */
        function readdirMock(path) {
            switch (path) {
                case '/home/test-repo/packages/package-a':
                case 'C:\\home\\test-repo\\packages\\package-a':
                    return Promise.resolve(['index.ts']);
                case '/home/test-repo/packages':
                case 'C:\\home\\test-repo\\packages':
                    return Promise.resolve([]);
                case '/home/test-repo':
                case 'C:\\home\\test-repo':
                    return Promise.resolve(['yarn.lock']);
            }
            throw new Error(`Mock cannot handle path: ${path}.`);
        }
        const yarnrcPath = await (0, yarn_1.getPathToLookForYarnrc)({
            cwd: isWindows ? 'C:\\home\\test-repo\\packages\\package-a' : '/home/test-repo/packages/package-a',
        }, readdirMock);
        (0, chai_1.should)().exist(yarnrcPath);
        yarnrcPath.should.equal(isWindows ? 'C:\\home\\test-repo\\.yarnrc.yml' : '/home/test-repo/.yarnrc.yml');
    });
});
//# sourceMappingURL=index.test.js.map