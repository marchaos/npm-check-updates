"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = __importDefault(require("chai"));
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
const chai_string_1 = __importDefault(require("chai-string"));
const promises_1 = __importDefault(require("fs/promises"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const spawn_please_1 = __importDefault(require("spawn-please"));
const should = chai_1.default.should();
chai_1.default.use(chai_as_promised_1.default);
chai_1.default.use(chai_string_1.default);
const bin = path_1.default.join(__dirname, '../build/src/bin/cli.js');
describe('--interactive', () => {
    it('prompt for each upgraded dependency', async () => {
        const tempDir = await promises_1.default.mkdtemp(path_1.default.join(os_1.default.tmpdir(), 'npm-check-updates-'));
        const pkgFile = path_1.default.join(tempDir, 'package.json');
        await promises_1.default.writeFile(pkgFile, JSON.stringify({
            dependencies: { 'ncu-test-v2': '1.0.0', 'ncu-test-return-version': '1.0.0', 'ncu-test-tag': '1.0.0' },
        }), 'utf-8');
        try {
            const stdout = await (0, spawn_please_1.default)('node', [bin, '--interactive'], {
                cwd: tempDir,
                env: {
                    ...process.env,
                    INJECT_PROMPTS: JSON.stringify([['ncu-test-v2', 'ncu-test-return-version'], true]),
                },
            });
            should.equal(/^Upgrading/m.test(stdout), true);
            // do not show install hint when choosing autoinstall
            should.equal(/^Run npm install to install new versions.$/m.test(stdout), false);
            const upgradedPkg = JSON.parse(await promises_1.default.readFile(pkgFile, 'utf-8'));
            upgradedPkg.dependencies.should.deep.equal({
                // upgraded
                'ncu-test-v2': '2.0.0',
                'ncu-test-return-version': '2.0.0',
                // no upgraded
                'ncu-test-tag': '1.0.0',
            });
        }
        finally {
            await promises_1.default.rm(tempDir, { recursive: true, force: true });
        }
    });
    it('with --format group', async () => {
        const tempDir = await promises_1.default.mkdtemp(path_1.default.join(os_1.default.tmpdir(), 'npm-check-updates-'));
        const pkgFile = path_1.default.join(tempDir, 'package.json');
        await promises_1.default.writeFile(pkgFile, JSON.stringify({
            dependencies: { 'ncu-test-v2': '1.0.0', 'ncu-test-return-version': '1.0.0', 'ncu-test-tag': '1.0.0' },
        }), 'utf-8');
        try {
            await (0, spawn_please_1.default)('node', [bin, '--interactive', '--format', 'group'], {
                cwd: tempDir,
                env: {
                    ...process.env,
                    INJECT_PROMPTS: JSON.stringify([['ncu-test-v2', 'ncu-test-return-version'], true]),
                },
            });
            const upgradedPkg = JSON.parse(await promises_1.default.readFile(pkgFile, 'utf-8'));
            upgradedPkg.dependencies.should.deep.equal({
                // upgraded
                'ncu-test-v2': '2.0.0',
                'ncu-test-return-version': '2.0.0',
                // no upgraded
                'ncu-test-tag': '1.0.0',
            });
            // prompts does not print during injection, so we cannot assert the output in interactive mode
        }
        finally {
            await promises_1.default.rm(tempDir, { recursive: true, force: true });
        }
    });
    it('with --format group and custom group function', async () => {
        const tempDir = await promises_1.default.mkdtemp(path_1.default.join(os_1.default.tmpdir(), 'npm-check-updates-'));
        const pkgFile = path_1.default.join(tempDir, 'package.json');
        await promises_1.default.writeFile(pkgFile, JSON.stringify({
            dependencies: { 'ncu-test-v2': '1.0.0', 'ncu-test-return-version': '1.0.0', 'ncu-test-tag': '1.0.0' },
        }), 'utf-8');
        const configFile = path_1.default.join(tempDir, '.ncurc.js');
        await promises_1.default.writeFile(configFile, `module.exports = { groupFunction: () => 'minor' }`, 'utf-8');
        try {
            await (0, spawn_please_1.default)('node', [bin, '--interactive', '--format', 'group', '--configFilePath', tempDir], {
                cwd: tempDir,
                env: {
                    ...process.env,
                    INJECT_PROMPTS: JSON.stringify([['ncu-test-v2', 'ncu-test-return-version'], true]),
                },
            });
            const upgradedPkg = JSON.parse(await promises_1.default.readFile(pkgFile, 'utf-8'));
            upgradedPkg.dependencies.should.deep.equal({
                // upgraded
                'ncu-test-v2': '2.0.0',
                'ncu-test-return-version': '2.0.0',
                // no upgraded
                'ncu-test-tag': '1.0.0',
            });
            // prompts does not print during injection, so we cannot assert the output in interactive mode
        }
        finally {
            await promises_1.default.rm(tempDir, { recursive: true, force: true });
        }
    });
});
//# sourceMappingURL=interactive.test.js.map