"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = __importDefault(require("chai"));
const getPreferredWildcard_1 = __importDefault(require("../src/lib/getPreferredWildcard"));
const should = chai_1.default.should();
process.env.NCU_TESTS = 'true';
describe('getPreferredWildcard', () => {
    it('identify ^ when it is preferred', () => {
        const deps = {
            async: '^0.9.0',
            bluebird: '^2.9.27',
            cint: '^8.2.1',
            commander: '~2.8.1',
            lodash: '^3.2.0',
        };
        (0, getPreferredWildcard_1.default)(deps).should.equal('^');
    });
    it('identify ~ when it is preferred', () => {
        const deps = {
            async: '~0.9.0',
            bluebird: '~2.9.27',
            cint: '^8.2.1',
            commander: '~2.8.1',
            lodash: '^3.2.0',
        };
        (0, getPreferredWildcard_1.default)(deps).should.equal('~');
    });
    it('identify .x when it is preferred', () => {
        const deps = {
            async: '0.9.x',
            bluebird: '2.9.x',
            cint: '^8.2.1',
            commander: '~2.8.1',
            lodash: '3.x',
        };
        (0, getPreferredWildcard_1.default)(deps).should.equal('.x');
    });
    it('identify .* when it is preferred', () => {
        const deps = {
            async: '0.9.*',
            bluebird: '2.9.*',
            cint: '^8.2.1',
            commander: '~2.8.1',
            lodash: '3.*',
        };
        (0, getPreferredWildcard_1.default)(deps).should.equal('.*');
    });
    it('do not allow wildcards to be outnumbered by non-wildcards', () => {
        const deps = {
            gulp: '^4.0.0',
            typescript: '3.3.0',
            webpack: '4.30.0',
        };
        (0, getPreferredWildcard_1.default)(deps).should.equal('^');
    });
    it('use the first wildcard if there is a tie', () => {
        const deps = {
            async: '0.9.x',
            commander: '2.8.*',
        };
        (0, getPreferredWildcard_1.default)(deps).should.equal('.x');
    });
    it('return null when it cannot be determined from other dependencies', () => {
        const deps = {
            async: '0.9.0',
            commander: '2.8.1',
            lodash: '3.2.0',
        };
        should.equal((0, getPreferredWildcard_1.default)(deps), null);
        should.equal((0, getPreferredWildcard_1.default)({}), null);
    });
});
//# sourceMappingURL=getPreferredWildcard.test.js.map