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
chai_1.default.should();
chai_1.default.use(chai_as_promised_1.default);
chai_1.default.use(chai_string_1.default);
const bin = path_1.default.join(__dirname, '../build/src/bin/cli.js');
/**
 * Sets up and tears down the temporary directories required to run each test
 */
async function groupTestScaffold(dependencies, groupFn, expectedOutput) {
    // use dynamic import for ESM module
    const { default: stripAnsi } = await import('strip-ansi');
    const tempDir = await promises_1.default.mkdtemp(path_1.default.join(os_1.default.tmpdir(), 'npm-check-updates-'));
    const pkgFile = path_1.default.join(tempDir, 'package.json');
    await promises_1.default.writeFile(pkgFile, JSON.stringify({
        dependencies,
    }), 'utf-8');
    const configFile = path_1.default.join(tempDir, '.ncurc.js');
    await promises_1.default.writeFile(configFile, `module.exports = { groupFunction: ${groupFn.toString()} }`, 'utf-8');
    try {
        const stdout = await (0, spawn_please_1.default)('node', [bin, '--format', 'group', '--configFilePath', tempDir], {
            cwd: tempDir,
        });
        stripAnsi(stdout).should.containIgnoreCase(expectedOutput);
    }
    finally {
        await promises_1.default.rm(tempDir, { recursive: true, force: true });
    }
}
describe('--format group', () => {
    it('group upgrades by type', async () => {
        await groupTestScaffold({ 'ncu-test-v2': '1.0.0', 'ncu-test-return-version': '1.0.0', 'ncu-test-tag': '1.0.0' }, (packageName, defaultGroup) => defaultGroup, `Minor   Backwards-compatible features
 ncu-test-tag  1.0.0  →  1.1.0

Major   Potentially breaking API changes
 ncu-test-return-version  1.0.0  →  2.0.0
 ncu-test-v2              1.0.0  →  2.0.0`);
    });
    it('preserve version ranges', async () => {
        await groupTestScaffold({ 'ncu-test-v2': '^1.0.0' }, (packageName, defaultGroup) => defaultGroup, `Major   Potentially breaking API changes
 ncu-test-v2  ^1.0.0  →  ^2.0.0`);
    });
    it('moves package to major group', async () => {
        await groupTestScaffold({ 'ncu-test-v2': '1.0.0', 'ncu-test-return-version': '1.0.0', 'ncu-test-tag': '1.0.0' }, (packageName, defaultGroup) => (packageName === 'ncu-test-tag' ? 'major' : defaultGroup), `Major   Potentially breaking API changes
 ncu-test-return-version  1.0.0  →  2.0.0
 ncu-test-tag             1.0.0  →  1.1.0
 ncu-test-v2              1.0.0  →  2.0.0`);
    });
    it('moves package to minor group', async () => {
        await groupTestScaffold({ 'ncu-test-v2': '1.0.0', 'ncu-test-return-version': '1.0.0', 'ncu-test-tag': '1.0.0' }, (packageName, defaultGroup) => (packageName === 'ncu-test-v2' ? 'minor' : defaultGroup), `Minor   Backwards-compatible features
 ncu-test-tag  1.0.0  →  1.1.0
 ncu-test-v2   1.0.0  →  2.0.0

Major   Potentially breaking API changes
 ncu-test-return-version  1.0.0  →  2.0.0`);
    });
    it('moves package to patch group', async () => {
        await groupTestScaffold({ 'ncu-test-v2': '1.0.0', 'ncu-test-return-version': '1.0.0', 'ncu-test-tag': '1.0.0' }, (packageName, defaultGroup) => (packageName === 'ncu-test-v2' ? 'patch' : defaultGroup), `Patch   Backwards-compatible bug fixes
 ncu-test-v2  1.0.0  →  2.0.0

Minor   Backwards-compatible features
 ncu-test-tag  1.0.0  →  1.1.0

Major   Potentially breaking API changes
 ncu-test-return-version  1.0.0  →  2.0.0`);
    });
    it('moves package to majorVersionZero group', async () => {
        await groupTestScaffold({ 'ncu-test-v2': '1.0.0', 'ncu-test-return-version': '1.0.0', 'ncu-test-tag': '1.0.0' }, (packageName, defaultGroup) => (packageName === 'ncu-test-v2' ? 'majorVersionZero' : defaultGroup), `Minor   Backwards-compatible features
 ncu-test-tag  1.0.0  →  1.1.0

Major   Potentially breaking API changes
 ncu-test-return-version  1.0.0  →  2.0.0

Major version zero   Anything may change
 ncu-test-v2  1.0.0  →  2.0.0`);
    });
    it('creates custom groups', async () => {
        await groupTestScaffold({ 'ncu-test-v2': '1.0.0', 'ncu-test-return-version': '1.0.0', 'ncu-test-tag': '1.0.0' }, (packageName, defaultGroup, currentVersionSpec, upgradedVersionSpec, upgradedVersion) => `Custom Group for ${packageName} ${JSON.stringify(currentVersionSpec)} ${JSON.stringify(upgradedVersionSpec)} ${JSON.stringify(upgradedVersion)}`, `Custom Group for ncu-test-return-version [{"semver":"1.0.0","major":"1","minor":"0","patch":"0"}] [{"semver":"2.0.0","major":"2","minor":"0","patch":"0"}] {"semver":"2.0.0","version":"2.0.0","major":"2","minor":"0","patch":"0"}
 ncu-test-return-version  1.0.0  →  2.0.0

Custom Group for ncu-test-tag [{"semver":"1.0.0","major":"1","minor":"0","patch":"0"}] [{"semver":"1.1.0","major":"1","minor":"1","patch":"0"}] {"semver":"1.1.0","version":"1.1.0","major":"1","minor":"1","patch":"0"}
 ncu-test-tag  1.0.0  →  1.1.0

Custom Group for ncu-test-v2 [{"semver":"1.0.0","major":"1","minor":"0","patch":"0"}] [{"semver":"2.0.0","major":"2","minor":"0","patch":"0"}] {"semver":"2.0.0","version":"2.0.0","major":"2","minor":"0","patch":"0"}
 ncu-test-v2  1.0.0  →  2.0.0`);
    });
});
//# sourceMappingURL=group.test.js.map