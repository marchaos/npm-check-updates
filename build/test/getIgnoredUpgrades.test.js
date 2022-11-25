"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = __importDefault(require("chai"));
const getIgnoredUpgrades_1 = __importDefault(require("../src/lib/getIgnoredUpgrades"));
chai_1.default.should();
process.env.NCU_TESTS = 'true';
describe('getIgnoredUpgrades', function () {
    it('ncu-test-peer-update', async () => {
        const data = await (0, getIgnoredUpgrades_1.default)({
            'ncu-test-return-version': '1.0.0',
            'ncu-test-peer': '1.0.0',
        }, {
            'ncu-test-return-version': '1.1.0',
            'ncu-test-peer': '1.1.0',
        }, {
            'ncu-test-peer': {
                'ncu-test-return-version': '1.1.x',
            },
        }, {});
        data.should.deep.equal({
            'ncu-test-return-version': {
                from: '1.0.0',
                to: '2.0.0',
                reason: {
                    'ncu-test-peer': '1.1.x',
                },
            },
        });
    });
});
//# sourceMappingURL=getIgnoredUpgrades.test.js.map