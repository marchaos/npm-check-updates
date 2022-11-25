"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = __importDefault(require("chai"));
const getCurrentDependencies_1 = __importDefault(require("../src/lib/getCurrentDependencies"));
chai_1.default.should();
describe('getCurrentDependencies', () => {
    let deps;
    beforeEach(() => {
        deps = {
            dependencies: {
                mocha: '1.2',
            },
            devDependencies: {
                lodash: '^3.9.3',
            },
            peerDependencies: {
                moment: '^1.0.0',
            },
            optionalDependencies: {
                chalk: '^1.1.0',
            },
            bundleDependencies: {
                bluebird: '^1.0.0',
            },
        };
    });
    it('return an empty object for an empty package.json and handle default options', () => {
        (0, getCurrentDependencies_1.default)().should.eql({});
        (0, getCurrentDependencies_1.default)({}).should.eql({});
        (0, getCurrentDependencies_1.default)({}, {}).should.eql({});
    });
    it('get dependencies, devDependencies, and optionalDependencies by default', () => {
        (0, getCurrentDependencies_1.default)(deps).should.eql({
            mocha: '1.2',
            lodash: '^3.9.3',
            chalk: '^1.1.0',
            bluebird: '^1.0.0',
            moment: '^1.0.0',
        });
    });
    describe('dep', () => {
        it('only get dependencies with --dep prod', () => {
            (0, getCurrentDependencies_1.default)(deps, { dep: 'prod' }).should.eql({
                mocha: '1.2',
            });
        });
        it('only get devDependencies with --dep dev', () => {
            (0, getCurrentDependencies_1.default)(deps, { dep: 'dev' }).should.eql({
                lodash: '^3.9.3',
            });
        });
        it('only get optionalDependencies with --dep optional', () => {
            (0, getCurrentDependencies_1.default)(deps, { dep: 'optional' }).should.eql({
                chalk: '^1.1.0',
            });
        });
        it('only get peerDependencies with --dep peer', () => {
            (0, getCurrentDependencies_1.default)(deps, { dep: 'peer' }).should.eql({
                moment: '^1.0.0',
            });
        });
        it('only get bundleDependencies with --dep bundle', () => {
            (0, getCurrentDependencies_1.default)(deps, { dep: 'bundle' }).should.eql({
                bluebird: '^1.0.0',
            });
        });
        it('only get devDependencies and peerDependencies with --dep dev,peer', () => {
            (0, getCurrentDependencies_1.default)(deps, { dep: 'dev,peer' }).should.eql({
                lodash: '^3.9.3',
                moment: '^1.0.0',
            });
        });
    });
    describe('filter', () => {
        it('filter dependencies by package name', () => {
            (0, getCurrentDependencies_1.default)(deps, { filter: 'mocha' }).should.eql({
                mocha: '1.2',
            });
        });
        it('filter dependencies by @org/package name', () => {
            const deps = {
                dependencies: {
                    '@ngrx/store': '4.0.0',
                    mocha: '1.0.0',
                },
            };
            (0, getCurrentDependencies_1.default)(deps, { filter: '@ngrx/store' }).should.eql({
                '@ngrx/store': '4.0.0',
            });
        });
        it('do not filter out dependencies with a partial package name', () => {
            (0, getCurrentDependencies_1.default)(deps, { filter: 'o' }).should.eql({});
        });
        it('filter dependencies by multiple packages', () => {
            (0, getCurrentDependencies_1.default)(deps, { filter: 'mocha lodash' }).should.eql({
                mocha: '1.2',
                lodash: '^3.9.3',
            });
            (0, getCurrentDependencies_1.default)(deps, { filter: 'mocha,lodash' }).should.eql({
                mocha: '1.2',
                lodash: '^3.9.3',
            });
            (0, getCurrentDependencies_1.default)(deps, { filter: ['mocha', 'lodash'] }).should.eql({
                mocha: '1.2',
                lodash: '^3.9.3',
            });
        });
        it('filter dependencies by regex', () => {
            (0, getCurrentDependencies_1.default)(deps, { filter: /o/ }).should.eql({
                lodash: '^3.9.3',
                mocha: '1.2',
                moment: '^1.0.0',
            });
            (0, getCurrentDependencies_1.default)(deps, { filter: '/o/' }).should.eql({
                lodash: '^3.9.3',
                mocha: '1.2',
                moment: '^1.0.0',
            });
        });
        it.skip('should filter org dependencies by regex', () => {
            (0, getCurrentDependencies_1.default)(deps, { filter: /store/ }).should.eql({
                '@ngrx/store': '4.0.0',
            });
        });
        it('filter dependencies by name with a filter function', () => {
            (0, getCurrentDependencies_1.default)(deps, { filter: (s) => s.startsWith('m') }).should.eql({
                mocha: '1.2',
                moment: '^1.0.0',
            });
        });
        it('filter dependencies by version spec with a filter function', () => {
            (0, getCurrentDependencies_1.default)(deps, {
                filter: (name, versionSpec) => versionSpec[0].major === '1',
            }).should.eql({
                mocha: '1.2',
                moment: '^1.0.0',
                chalk: '^1.1.0',
                bluebird: '^1.0.0',
            });
        });
    });
    describe('filterVersion', () => {
        it('filter dependency versions by pinned version', () => {
            (0, getCurrentDependencies_1.default)(deps, { filterVersion: '1.2' }).should.eql({
                mocha: '1.2',
            });
        });
        it('filter dependency versions by caret version', () => {
            (0, getCurrentDependencies_1.default)(deps, { filterVersion: '^1.0.0' }).should.eql({
                moment: '^1.0.0',
                bluebird: '^1.0.0',
            });
        });
        it('filter dependencies by multiple versions (comma-or-space-delimited)', () => {
            (0, getCurrentDependencies_1.default)(deps, { filterVersion: '^1.0.0,^1.1.0' }).should.eql({
                chalk: '^1.1.0',
                moment: '^1.0.0',
                bluebird: '^1.0.0',
            });
            (0, getCurrentDependencies_1.default)(deps, { filterVersion: '^1.0.0 ^1.1.0' }).should.eql({
                chalk: '^1.1.0',
                moment: '^1.0.0',
                bluebird: '^1.0.0',
            });
        });
        it('filter dependency versions by regex', () => {
            (0, getCurrentDependencies_1.default)(deps, { filterVersion: '/^\\^1/' }).should.eql({
                chalk: '^1.1.0',
                moment: '^1.0.0',
                bluebird: '^1.0.0',
            });
            (0, getCurrentDependencies_1.default)(deps, { filterVersion: /^\^1/ }).should.eql({
                chalk: '^1.1.0',
                moment: '^1.0.0',
                bluebird: '^1.0.0',
            });
        });
        it('filter dependencies by version spec with a filterVersion function', () => {
            (0, getCurrentDependencies_1.default)(deps, {
                filterVersion: (name, versionSpec) => versionSpec[0].major === '1',
            }).should.eql({
                mocha: '1.2',
                moment: '^1.0.0',
                chalk: '^1.1.0',
                bluebird: '^1.0.0',
            });
        });
    });
    describe('reject', () => {
        it('reject dependencies by package name', () => {
            (0, getCurrentDependencies_1.default)(deps, { reject: 'chalk' }).should.eql({
                mocha: '1.2',
                lodash: '^3.9.3',
                bluebird: '^1.0.0',
                moment: '^1.0.0',
            });
        });
        it('do not reject dependencies with a partial package name', () => {
            (0, getCurrentDependencies_1.default)(deps, { reject: 'o' }).should.eql({
                mocha: '1.2',
                lodash: '^3.9.3',
                chalk: '^1.1.0',
                bluebird: '^1.0.0',
                moment: '^1.0.0',
            });
        });
        it('reject dependencies by multiple packages', () => {
            (0, getCurrentDependencies_1.default)(deps, { reject: 'mocha lodash' }).should.eql({
                chalk: '^1.1.0',
                bluebird: '^1.0.0',
                moment: '^1.0.0',
            });
            (0, getCurrentDependencies_1.default)(deps, { reject: 'mocha,lodash' }).should.eql({
                chalk: '^1.1.0',
                bluebird: '^1.0.0',
                moment: '^1.0.0',
            });
            (0, getCurrentDependencies_1.default)(deps, { reject: ['mocha', 'lodash'] }).should.eql({
                chalk: '^1.1.0',
                bluebird: '^1.0.0',
                moment: '^1.0.0',
            });
        });
        it('reject dependencies by regex', () => {
            (0, getCurrentDependencies_1.default)(deps, { reject: /o/ }).should.eql({
                chalk: '^1.1.0',
                bluebird: '^1.0.0',
            });
            (0, getCurrentDependencies_1.default)(deps, { reject: '/o/' }).should.eql({
                chalk: '^1.1.0',
                bluebird: '^1.0.0',
            });
        });
        it('reject dependencies by function', () => {
            (0, getCurrentDependencies_1.default)(deps, { reject: (s) => s.startsWith('m') }).should.eql({
                lodash: '^3.9.3',
                chalk: '^1.1.0',
                bluebird: '^1.0.0',
            });
        });
        it('filter and reject', () => {
            (0, getCurrentDependencies_1.default)(deps, { filter: 'mocha chalk', reject: 'chalk' }).should.eql({
                mocha: '1.2',
            });
        });
    });
    describe('rejectVersion', () => {
        it('reject dependency versions by pinned version', () => {
            (0, getCurrentDependencies_1.default)(deps, { rejectVersion: '1.2' }).should.eql({
                lodash: '^3.9.3',
                moment: '^1.0.0',
                chalk: '^1.1.0',
                bluebird: '^1.0.0',
            });
        });
        it('reject dependency versions by caret version', () => {
            (0, getCurrentDependencies_1.default)(deps, { rejectVersion: '^1.0.0' }).should.eql({
                mocha: '1.2',
                lodash: '^3.9.3',
                chalk: '^1.1.0',
            });
        });
        it('reject dependencies by multiple versions (comma-or-space-delimited)', () => {
            (0, getCurrentDependencies_1.default)(deps, { rejectVersion: '^1.0.0,^1.1.0' }).should.eql({
                mocha: '1.2',
                lodash: '^3.9.3',
            });
            (0, getCurrentDependencies_1.default)(deps, { rejectVersion: '^1.0.0 ^1.1.0' }).should.eql({
                mocha: '1.2',
                lodash: '^3.9.3',
            });
        });
        it('reject dependency versions by regex', () => {
            (0, getCurrentDependencies_1.default)(deps, { rejectVersion: '/^\\^1/' }).should.eql({
                mocha: '1.2',
                lodash: '^3.9.3',
            });
            (0, getCurrentDependencies_1.default)(deps, { rejectVersion: /^\^1/ }).should.eql({
                mocha: '1.2',
                lodash: '^3.9.3',
            });
        });
        it('reject dependency versions by function', () => {
            (0, getCurrentDependencies_1.default)(deps, { rejectVersion: (s) => s.startsWith('^3') }).should.eql({
                mocha: '1.2',
                moment: '^1.0.0',
                chalk: '^1.1.0',
                bluebird: '^1.0.0',
            });
        });
    });
});
//# sourceMappingURL=getCurrentDependencies.test.js.map