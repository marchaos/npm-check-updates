"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = __importDefault(require("chai"));
const chalk_1 = require("../src/lib/chalk");
const getPeerDependenciesFromRegistry_1 = __importDefault(require("../src/lib/getPeerDependenciesFromRegistry"));
chai_1.default.should();
process.env.NCU_TESTS = 'true';
describe('getPeerDependenciesFromRegistry', function () {
    it('single package', async () => {
        await (0, chalk_1.chalkInit)();
        const data = await (0, getPeerDependenciesFromRegistry_1.default)({ 'ncu-test-peer': '1.0' }, {});
        data.should.deep.equal({
            'ncu-test-peer': {
                'ncu-test-return-version': '1.x',
            },
        });
    });
    it('single package empty', async () => {
        await (0, chalk_1.chalkInit)();
        const data = await (0, getPeerDependenciesFromRegistry_1.default)({ 'ncu-test-return-version': '1.0' }, {});
        data.should.deep.equal({ 'ncu-test-return-version': {} });
    });
    it('multiple packages', async () => {
        await (0, chalk_1.chalkInit)();
        const data = await (0, getPeerDependenciesFromRegistry_1.default)({
            'ncu-test-return-version': '1.0.0',
            'ncu-test-peer': '1.0.0',
        }, {});
        data.should.deep.equal({
            'ncu-test-return-version': {},
            'ncu-test-peer': {
                'ncu-test-return-version': '1.x',
            },
        });
    });
});
//# sourceMappingURL=getPeerDependenciesFromRegistry.test.js.map