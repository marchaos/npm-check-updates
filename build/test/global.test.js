"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const spawn_please_1 = __importDefault(require("spawn-please"));
process.env.NCU_TESTS = 'true';
const bin = path_1.default.join(__dirname, '../build/src/bin/cli.js');
describe('global', () => {
    // TODO: Hangs on Windows
    const test = process.platform === 'win32' ? it.skip : it;
    test('global should run', async () => {
        await (0, spawn_please_1.default)('node', [bin, '--global']);
    });
});
//# sourceMappingURL=global.test.js.map