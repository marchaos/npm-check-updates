"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = __importDefault(require("chai"));
const upgradeDependencies_1 = __importDefault(require("../src/lib/upgradeDependencies"));
chai_1.default.should();
process.env.NCU_TESTS = 'true';
describe('upgradeDependencies', () => {
    it('upgrade simple, non-semver versions', () => {
        (0, upgradeDependencies_1.default)({ foo: '1' }, { foo: '2' }).should.eql({ foo: '2' });
        (0, upgradeDependencies_1.default)({ foo: '1.0' }, { foo: '1.1' }).should.eql({ foo: '1.1' });
        (0, upgradeDependencies_1.default)({ 'ncu-test-simple-tag': 'v1' }, { 'ncu-test-simple-tag': 'v3' }).should.eql({
            'ncu-test-simple-tag': 'v3',
        });
    });
    it('upgrade github dependencies', () => {
        (0, upgradeDependencies_1.default)({ foo: 'github:foo/bar#v1' }, { foo: 'github:foo/bar#v2' }).should.eql({
            foo: 'github:foo/bar#v2',
        });
        (0, upgradeDependencies_1.default)({ foo: 'github:foo/bar#v1.0' }, { foo: 'github:foo/bar#v2.0' }).should.eql({
            foo: 'github:foo/bar#v2.0',
        });
        (0, upgradeDependencies_1.default)({ foo: 'github:foo/bar#v1.0.0' }, { foo: 'github:foo/bar#v2.0.0' }).should.eql({
            foo: 'github:foo/bar#v2.0.0',
        });
    });
    it('upgrade latest versions that already satisfy the specified version', () => {
        (0, upgradeDependencies_1.default)({ mongodb: '^1.0.0' }, { mongodb: '1.4.30' }).should.eql({
            mongodb: '^1.4.30',
        });
    });
    it('do not downgrade', () => {
        (0, upgradeDependencies_1.default)({ mongodb: '^2.0.7' }, { mongodb: '1.4.30' }).should.eql({});
    });
    it('use the preferred wildcard when converting <, closed, or mixed ranges', () => {
        (0, upgradeDependencies_1.default)({ a: '1.*', mongodb: '<1.0' }, { mongodb: '3.0.0' }).should.eql({ mongodb: '3.*' });
        (0, upgradeDependencies_1.default)({ a: '1.x', mongodb: '<1.0' }, { mongodb: '3.0.0' }).should.eql({ mongodb: '3.x' });
        (0, upgradeDependencies_1.default)({ a: '~1', mongodb: '<1.0' }, { mongodb: '3.0.0' }).should.eql({ mongodb: '~3.0' });
        (0, upgradeDependencies_1.default)({ a: '^1', mongodb: '<1.0' }, { mongodb: '3.0.0' }).should.eql({ mongodb: '^3.0' });
        (0, upgradeDependencies_1.default)({ a: '1.*', mongodb: '1.0 < 2.0' }, { mongodb: '3.0.0' }).should.eql({ mongodb: '3.*' });
        (0, upgradeDependencies_1.default)({ mongodb: '1.0 < 2.*' }, { mongodb: '3.0.0' }).should.eql({ mongodb: '3.*' });
    });
    it('convert closed ranges to caret (^) when preferred wildcard is unknown', () => {
        (0, upgradeDependencies_1.default)({ mongodb: '1.0 < 2.0' }, { mongodb: '3.0.0' }).should.eql({ mongodb: '^3.0' });
    });
    it('ignore packages with empty values', () => {
        (0, upgradeDependencies_1.default)({ mongodb: null }, { mongodb: '1.4.30' }).should.eql({});
        (0, upgradeDependencies_1.default)({ mongodb: '' }, { mongodb: '1.4.30' }).should.eql({});
    });
});
//# sourceMappingURL=upgradeDependencies.test.js.map