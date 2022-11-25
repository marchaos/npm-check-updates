"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = __importDefault(require("chai"));
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
const promises_1 = __importDefault(require("fs/promises"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const spawn_please_1 = __importDefault(require("spawn-please"));
const ncu = __importStar(require("../src/"));
chai_1.default.should();
chai_1.default.use(chai_as_promised_1.default);
process.env.NCU_TESTS = 'true';
const bin = path_1.default.join(__dirname, '../build/src/bin/cli.js');
/** Creates a temp directory with nested package files for --workspaces testing. Returns the temp directory name (should be removed by caller).
 *
 * The file tree that is created is:
 * |- package.json
 * |- packages/
 * |  - a/
 * |    - package.json
 * |  - b/
 * |    - package.json
 */
const setup = async (workspaces = ['packages/**']) => {
    const tempDir = await promises_1.default.mkdtemp(path_1.default.join(os_1.default.tmpdir(), 'npm-check-updates-'));
    await promises_1.default.mkdtemp(path_1.default.join(os_1.default.tmpdir(), 'npm-check-updates-'));
    const pkgDataRoot = JSON.stringify({
        dependencies: {
            'ncu-test-v2': '1.0.0',
        },
        workspaces,
    });
    const pkgDataA = JSON.stringify({
        dependencies: {
            'ncu-test-tag': '1.0.0',
        },
    });
    const pkgDataB = JSON.stringify({
        dependencies: {
            'ncu-test-return-version': '1.0.0',
        },
    });
    // write root package file
    await promises_1.default.writeFile(path_1.default.join(tempDir, 'package.json'), pkgDataRoot, 'utf-8');
    // write workspace package files
    await promises_1.default.mkdir(path_1.default.join(tempDir, 'packages/a'), { recursive: true });
    await promises_1.default.writeFile(path_1.default.join(tempDir, 'packages/a/package.json'), pkgDataA, 'utf-8');
    await promises_1.default.mkdir(path_1.default.join(tempDir, 'packages/b'), { recursive: true });
    await promises_1.default.writeFile(path_1.default.join(tempDir, 'packages/b/package.json'), pkgDataB, 'utf-8');
    return tempDir;
};
/** Sets up a workspace with a dependency to a symlinked workspace package. */
const setupSymlinkedPackages = async (workspaces = ['packages/**'], customName) => {
    const tempDir = await promises_1.default.mkdtemp(path_1.default.join(os_1.default.tmpdir(), 'npm-check-updates-'));
    await promises_1.default.mkdtemp(path_1.default.join(os_1.default.tmpdir(), 'npm-check-updates-'));
    const pkgDataRoot = JSON.stringify({ workspaces });
    const pkgDataFoo = JSON.stringify({
        dependencies: {
            [customName || 'bar']: '0.4.2',
            'ncu-test-v2': '1.0.0',
        },
    });
    const pkgDataBar = JSON.stringify({
        ...(customName ? { name: customName } : null),
        dependencies: {
            'ncu-test-v2': '1.1.0',
        },
    });
    // write root package file
    await promises_1.default.writeFile(path_1.default.join(tempDir, 'package.json'), pkgDataRoot, 'utf-8');
    // write workspace package files
    await promises_1.default.mkdir(path_1.default.join(tempDir, 'packages/foo'), { recursive: true });
    await promises_1.default.writeFile(path_1.default.join(tempDir, 'packages/foo/package.json'), pkgDataFoo, 'utf-8');
    await promises_1.default.mkdir(path_1.default.join(tempDir, 'packages/bar'), { recursive: true });
    await promises_1.default.writeFile(path_1.default.join(tempDir, 'packages/bar/package.json'), pkgDataBar, 'utf-8');
    return tempDir;
};
describe('--workspaces', function () {
    this.timeout(60000);
    it('do not allow --workspaces and --deep together', () => {
        ncu.run({ workspaces: true, deep: true }).should.eventually.be.rejectedWith('Cannot specify both');
    });
    it('update workspaces with --workspaces', async () => {
        const tempDir = await setup(['packages/a']);
        try {
            const output = await (0, spawn_please_1.default)('node', [bin, '--jsonAll', '--workspaces'], { cwd: tempDir }).then(JSON.parse);
            output.should.not.have.property('package.json');
            output.should.have.property('packages/a/package.json');
            output.should.not.have.property('packages/b/package.json');
            output['packages/a/package.json'].dependencies.should.have.property('ncu-test-tag');
        }
        finally {
            await promises_1.default.rm(tempDir, { recursive: true, force: true });
        }
    });
    it('update workspaces glob', async () => {
        const tempDir = await setup();
        try {
            const output = await (0, spawn_please_1.default)('node', [bin, '--jsonAll', '--workspaces'], { cwd: tempDir }).then(JSON.parse);
            output.should.not.have.property('package.json');
            output.should.have.property('packages/a/package.json');
            output.should.have.property('packages/b/package.json');
            output['packages/a/package.json'].dependencies.should.have.property('ncu-test-tag');
            output['packages/b/package.json'].dependencies.should.have.property('ncu-test-return-version');
        }
        finally {
            await promises_1.default.rm(tempDir, { recursive: true, force: true });
        }
    });
    it('update workspaces with -ws', async () => {
        const tempDir = await setup();
        try {
            const output = await (0, spawn_please_1.default)('node', [bin, '--jsonAll', '-ws'], { cwd: tempDir }).then(JSON.parse);
            output.should.not.have.property('package.json');
            output.should.have.property('packages/a/package.json');
            output.should.have.property('packages/b/package.json');
            output['packages/a/package.json'].dependencies.should.have.property('ncu-test-tag');
            output['packages/b/package.json'].dependencies.should.have.property('ncu-test-return-version');
        }
        finally {
            await promises_1.default.rm(tempDir, { recursive: true, force: true });
        }
    });
    it('do not update non-workspace subpackages', async () => {
        const tempDir = await setup();
        await promises_1.default.mkdir(path_1.default.join(tempDir, 'other'), { recursive: true });
        await promises_1.default.writeFile(path_1.default.join(tempDir, 'other/package.json'), JSON.stringify({
            dependencies: {
                'ncu-test-return-version': '1.0.0',
            },
        }), 'utf-8');
        try {
            const output = await (0, spawn_please_1.default)('node', [bin, '--jsonAll', '--workspaces'], { cwd: tempDir }).then(JSON.parse);
            output.should.not.have.property('package.json');
            output.should.have.property('packages/a/package.json');
            output.should.have.property('packages/b/package.json');
            output.should.not.have.property('other/package.json');
            output['packages/a/package.json'].dependencies.should.have.property('ncu-test-tag');
            output['packages/b/package.json'].dependencies.should.have.property('ncu-test-return-version');
        }
        finally {
            await promises_1.default.rm(tempDir, { recursive: true, force: true });
        }
    });
    // support for object type with packages property
    // https://classic.yarnpkg.com/blog/2018/02/15/nohoist/
    it('update workspaces/packages', async () => {
        const tempDir = await setup({ packages: ['packages/**'] });
        try {
            const output = await (0, spawn_please_1.default)('node', [bin, '--jsonAll', '--workspaces'], { cwd: tempDir }).then(JSON.parse);
            output.should.not.have.property('package.json');
            output.should.have.property('packages/a/package.json');
            output.should.have.property('packages/b/package.json');
            output['packages/a/package.json'].dependencies.should.have.property('ncu-test-tag');
            output['packages/b/package.json'].dependencies.should.have.property('ncu-test-return-version');
        }
        finally {
            await promises_1.default.rm(tempDir, { recursive: true, force: true });
        }
    });
    // https://github.com/raineorshine/npm-check-updates/issues/1217
    it('ignore local workspace packages', async () => {
        const tempDir = await setupSymlinkedPackages();
        try {
            const upgrades = await (0, spawn_please_1.default)('node', [bin, '--jsonUpgraded', '--workspaces'], { cwd: tempDir }).then(JSON.parse);
            upgrades.should.deep.equal({
                'packages/foo/package.json': {
                    'ncu-test-v2': '2.0.0',
                },
                'packages/bar/package.json': {
                    'ncu-test-v2': '2.0.0',
                },
            });
        }
        finally {
            await promises_1.default.rm(tempDir, { recursive: true, force: true });
        }
    });
    it('ignore local workspace packages with different names than their folders', async () => {
        const tempDir = await setupSymlinkedPackages(['packages/**'], 'chalk');
        try {
            const upgrades = await (0, spawn_please_1.default)('node', [bin, '--jsonUpgraded', '--workspaces'], { cwd: tempDir }).then(JSON.parse);
            upgrades.should.deep.equal({
                'packages/foo/package.json': {
                    'ncu-test-v2': '2.0.0',
                },
                'packages/bar/package.json': {
                    'ncu-test-v2': '2.0.0',
                },
            });
        }
        finally {
            await promises_1.default.rm(tempDir, { recursive: true, force: true });
        }
    });
});
describe('--workspace', function () {
    this.timeout(60000);
    it('do not allow --workspace and --deep together', () => {
        ncu.run({ workspace: ['a'], deep: true }).should.eventually.be.rejectedWith('Cannot specify both');
    });
    it('do not allow --workspace and --workspaces together', () => {
        ncu.run({ workspace: ['a'], deep: true }).should.eventually.be.rejectedWith('Cannot specify both');
    });
    it('update single workspace with --workspace', async () => {
        const tempDir = await setup();
        try {
            const output = await (0, spawn_please_1.default)('node', [bin, '--jsonAll', '--workspace', 'a'], { cwd: tempDir }).then(JSON.parse);
            output.should.not.have.property('package.json');
            output.should.have.property('packages/a/package.json');
            output.should.not.have.property('packages/b/package.json');
            output['packages/a/package.json'].dependencies.should.have.property('ncu-test-tag');
        }
        finally {
            await promises_1.default.rm(tempDir, { recursive: true, force: true });
        }
    });
    it('update single workspace with -w', async () => {
        const tempDir = await setup();
        try {
            const output = await (0, spawn_please_1.default)('node', [bin, '--jsonAll', '-w', 'a'], { cwd: tempDir }).then(JSON.parse);
            output.should.not.have.property('package.json');
            output.should.have.property('packages/a/package.json');
            output.should.not.have.property('packages/b/package.json');
            output['packages/a/package.json'].dependencies.should.have.property('ncu-test-tag');
        }
        finally {
            await promises_1.default.rm(tempDir, { recursive: true, force: true });
        }
    });
    it('update more than one workspace', async () => {
        const tempDir = await setup();
        try {
            const output = await (0, spawn_please_1.default)('node', [bin, '--jsonAll', '--workspace', 'a', '--workspace', 'b'], {
                cwd: tempDir,
            }).then(JSON.parse);
            output.should.not.have.property('package.json');
            output.should.have.property('packages/a/package.json');
            output.should.have.property('packages/b/package.json');
            output['packages/a/package.json'].dependencies.should.have.property('ncu-test-tag');
            output['packages/b/package.json'].dependencies.should.have.property('ncu-test-return-version');
        }
        finally {
            await promises_1.default.rm(tempDir, { recursive: true, force: true });
        }
    });
});
describe('--workspaces --root', function () {
    this.timeout(60000);
    it('update root project and workspaces', async () => {
        const tempDir = await setup();
        try {
            const output = await (0, spawn_please_1.default)('node', [bin, '--jsonAll', '--workspaces', '--root'], { cwd: tempDir }).then(JSON.parse);
            output.should.have.property('package.json');
            output.should.have.property('packages/a/package.json');
            output.should.have.property('packages/b/package.json');
            output['package.json'].dependencies.should.have.property('ncu-test-v2');
            output['packages/a/package.json'].dependencies.should.have.property('ncu-test-tag');
            output['packages/b/package.json'].dependencies.should.have.property('ncu-test-return-version');
        }
        finally {
            await promises_1.default.rm(tempDir, { recursive: true, force: true });
        }
    });
    it('do not update non-workspace subpackages', async () => {
        const tempDir = await setup();
        await promises_1.default.mkdir(path_1.default.join(tempDir, 'other'), { recursive: true });
        await promises_1.default.writeFile(path_1.default.join(tempDir, 'other/package.json'), JSON.stringify({
            dependencies: {
                'ncu-test-return-version': '1.0.0',
            },
        }), 'utf-8');
        try {
            const output = await (0, spawn_please_1.default)('node', [bin, '--jsonAll', '--workspaces', '--root'], { cwd: tempDir }).then(JSON.parse);
            output.should.have.property('package.json');
            output.should.have.property('packages/a/package.json');
            output.should.have.property('packages/b/package.json');
            output.should.not.have.property('other/package.json');
            output['package.json'].dependencies.should.have.property('ncu-test-v2');
            output['packages/a/package.json'].dependencies.should.have.property('ncu-test-tag');
            output['packages/b/package.json'].dependencies.should.have.property('ncu-test-return-version');
        }
        finally {
            await promises_1.default.rm(tempDir, { recursive: true, force: true });
        }
    });
});
describe('--workspace and --root', function () {
    this.timeout(60000);
    it('update root project and single workspace', async () => {
        const tempDir = await setup();
        try {
            const output = await (0, spawn_please_1.default)('node', [bin, '--jsonAll', '--workspace', 'a', '--root'], { cwd: tempDir }).then(JSON.parse);
            output.should.have.property('package.json');
            output.should.have.property('packages/a/package.json');
            output.should.not.have.property('packages/b/package.json');
            output['package.json'].dependencies.should.have.property('ncu-test-v2');
            output['packages/a/package.json'].dependencies.should.have.property('ncu-test-tag');
        }
        finally {
            await promises_1.default.rm(tempDir, { recursive: true, force: true });
        }
    });
    it('update more than one workspace', async () => {
        const tempDir = await setup();
        try {
            const output = await (0, spawn_please_1.default)('node', [bin, '--jsonAll', '--workspace', 'a', '--workspace', 'b', '--root'], {
                cwd: tempDir,
            }).then(JSON.parse);
            output.should.have.property('package.json');
            output.should.have.property('packages/a/package.json');
            output.should.have.property('packages/b/package.json');
            output['package.json'].dependencies.should.have.property('ncu-test-v2');
            output['packages/a/package.json'].dependencies.should.have.property('ncu-test-tag');
            output['packages/b/package.json'].dependencies.should.have.property('ncu-test-return-version');
        }
        finally {
            await promises_1.default.rm(tempDir, { recursive: true, force: true });
        }
    });
});
//# sourceMappingURL=workspaces.test.js.map