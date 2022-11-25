"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const getInstalledPackages_1 = __importDefault(require("../src/lib/getInstalledPackages"));
// test getInstalledPackages since we cannot test runGlobal without additional code for mocking
describe('getInstalledPackages', () => {
    it('execute npm ls', async () => {
        await (0, getInstalledPackages_1.default)();
    });
});
//# sourceMappingURL=getInstalledPackages.test.js.map