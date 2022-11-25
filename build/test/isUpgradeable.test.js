"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = __importDefault(require("chai"));
const isUpgradeable_1 = __importDefault(require("../src/lib/isUpgradeable"));
chai_1.default.should();
process.env.NCU_TESTS = 'true';
describe('isUpgradeable', () => {
    it('do not upgrade pure wildcards', () => {
        (0, isUpgradeable_1.default)('*', '0.5.1').should.equal(false);
    });
    it('upgrade versions that do not satisfy latest versions', () => {
        (0, isUpgradeable_1.default)('0.1.x', '0.5.1').should.equal(true);
    });
    it('do not upgrade invalid versions', () => {
        (0, isUpgradeable_1.default)('https://github.com/strongloop/express', '4.11.2').should.equal(false);
    });
    it('do not upgrade versions beyond the latest', () => {
        (0, isUpgradeable_1.default)('5.0.0', '4.11.2').should.equal(false);
    });
    it('handle comparison constraints', () => {
        (0, isUpgradeable_1.default)('>1.0', '0.5.1').should.equal(false);
        (0, isUpgradeable_1.default)('<3.0 >0.1', '0.5.1').should.equal(false);
        (0, isUpgradeable_1.default)('>0.1.x', '0.5.1').should.equal(true);
        (0, isUpgradeable_1.default)('<7.0.0', '7.2.0').should.equal(true);
        (0, isUpgradeable_1.default)('<7.0', '7.2.0').should.equal(true);
        (0, isUpgradeable_1.default)('<7', '7.2.0').should.equal(true);
    });
    it('upgrade simple versions', () => {
        (0, isUpgradeable_1.default)('v1', 'v2').should.equal(true);
    });
});
//# sourceMappingURL=isUpgradeable.test.js.map