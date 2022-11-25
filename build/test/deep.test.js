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
const mergeOptions_1 = __importDefault(require("../src/lib/mergeOptions"));
chai_1.default.should();
chai_1.default.use(chai_as_promised_1.default);
process.env.NCU_TESTS = 'true';
const bin = path_1.default.join(__dirname, '../build/src/bin/cli.js');
/** Creates a temp directory with nested package files for --deep testing. Returns the temp directory name (should be removed by caller).
 *
 * The file tree that is created is:
 * |- package.json
 * |- packages/
 * |  - sub1/
 * |    - package.json
 * |  - sub2/
 * |    - package.json
 */
const setupDeepTest = async () => {
    const tempDir = await promises_1.default.mkdtemp(path_1.default.join(os_1.default.tmpdir(), 'npm-check-updates-'));
    await promises_1.default.mkdtemp(path_1.default.join(os_1.default.tmpdir(), 'npm-check-updates-'));
    const pkgData = JSON.stringify({
        dependencies: {
            express: '1',
        },
    });
    // write root package file
    await promises_1.default.writeFile(path_1.default.join(tempDir, 'package.json'), pkgData, 'utf-8');
    // write subproject package files
    await promises_1.default.mkdir(path_1.default.join(tempDir, 'packages/sub1'), { recursive: true });
    await promises_1.default.writeFile(path_1.default.join(tempDir, 'packages/sub1/package.json'), pkgData, 'utf-8');
    await promises_1.default.mkdir(path_1.default.join(tempDir, 'packages/sub2'), { recursive: true });
    await promises_1.default.writeFile(path_1.default.join(tempDir, 'packages/sub2/package.json'), pkgData, 'utf-8');
    return tempDir;
};
describe('--deep', function () {
    this.timeout(60000);
    it('do not allow --packageFile and --deep together', () => {
        ncu.run({ packageFile: './package.json', deep: true }).should.eventually.be.rejectedWith('Cannot specify both');
    });
    it('output json with --jsonAll', async () => {
        const tempDir = await setupDeepTest();
        try {
            const deepJsonOut = await (0, spawn_please_1.default)('node', [bin, '--jsonAll', '--deep'], { cwd: tempDir }).then(JSON.parse);
            deepJsonOut.should.have.property('package.json');
            deepJsonOut.should.have.property('packages/sub1/package.json');
            deepJsonOut.should.have.property('packages/sub2/package.json');
            deepJsonOut['package.json'].dependencies.should.have.property('express');
            deepJsonOut['packages/sub1/package.json'].dependencies.should.have.property('express');
            deepJsonOut['packages/sub2/package.json'].dependencies.should.have.property('express');
        }
        finally {
            await promises_1.default.rm(tempDir, { recursive: true, force: true });
        }
    });
    it('ignore stdin if --packageFile glob is specified', async () => {
        const tempDir = await setupDeepTest();
        try {
            await (0, spawn_please_1.default)('node', [bin, '-u', '--packageFile', path_1.default.join(tempDir, '/**/package.json')], '{ "dependencies": {}}', {
                cwd: tempDir,
            });
            const upgradedPkg = JSON.parse(await promises_1.default.readFile(path_1.default.join(tempDir, 'package.json'), 'utf-8'));
            upgradedPkg.should.have.property('dependencies');
            upgradedPkg.dependencies.should.have.property('express');
            upgradedPkg.dependencies.express.should.not.equal('1');
        }
        finally {
            await promises_1.default.rm(tempDir, { recursive: true, force: true });
        }
    });
    it('update multiple packages', async () => {
        const tempDir = await setupDeepTest();
        try {
            const output = await (0, spawn_please_1.default)('node', [bin, '-u', '--jsonUpgraded', '--packageFile', path_1.default.join(tempDir, '**/package.json')], '{ "dependencies": {}}', { cwd: tempDir });
            const upgradedPkg1 = JSON.parse(await promises_1.default.readFile(path_1.default.join(tempDir, 'packages/sub1/package.json'), 'utf-8'));
            upgradedPkg1.should.have.property('dependencies');
            upgradedPkg1.dependencies.should.have.property('express');
            upgradedPkg1.dependencies.express.should.not.equal('1');
            const upgradedPkg2 = JSON.parse(await promises_1.default.readFile(path_1.default.join(tempDir, 'packages/sub2/package.json'), 'utf-8'));
            upgradedPkg2.should.have.property('dependencies');
            upgradedPkg2.dependencies.should.have.property('express');
            upgradedPkg2.dependencies.express.should.not.equal('1');
            const json = JSON.parse(output);
            json.should.have.property(path_1.default.join(tempDir, 'packages/sub1/package.json'));
            json.should.have.property(path_1.default.join(tempDir, 'packages/sub2/package.json'));
            json.should.have.property(path_1.default.join(tempDir, 'package.json'));
        }
        finally {
            await promises_1.default.rm(tempDir, { recursive: true, force: true });
        }
    });
});
describe('--deep with nested ncurc files', function () {
    const cwd = path_1.default.join(__dirname, 'deep-ncurc');
    this.timeout(60000);
    it('use ncurc of nested packages', async () => {
        const deepJsonOut = await (0, spawn_please_1.default)('node', [bin, '--jsonUpgraded', '--deep'], { cwd }).then(JSON.parse);
        // root: reject: ['cute-animals']
        deepJsonOut.should.have.property('package.json');
        deepJsonOut['package.json'].should.not.have.property('cute-animals');
        deepJsonOut['package.json'].should.have.property('fp-and-or');
        // pkg1: reject: ['fp-ando-or']
        deepJsonOut.should.have.property('pkg/sub1/package.json');
        deepJsonOut['pkg/sub1/package.json'].should.have.property('cute-animals');
        deepJsonOut['pkg/sub1/package.json'].should.not.have.property('fp-and-or');
        deepJsonOut['pkg/sub1/package.json'].should.have.property('ncu-test-return-version');
        // pkg2: reject: ['cute-animals']
        deepJsonOut.should.have.property('pkg/sub2/package.json');
        deepJsonOut['pkg/sub2/package.json'].should.not.have.property('cute-animals');
        deepJsonOut['pkg/sub2/package.json'].should.have.property('fp-and-or');
        deepJsonOut['pkg/sub2/package.json'].should.have.property('ncu-test-v2');
        // pkg3: reject: ['cute-animals']
        deepJsonOut.should.have.property('pkg/sub3/package.json');
        deepJsonOut['pkg/sub3/package.json'].should.not.have.property('cute-animals');
        deepJsonOut['pkg/sub3/package.json'].should.have.property('fp-and-or');
        deepJsonOut['pkg/sub3/package.json'].should.have.property('ncu-test-v2');
    });
    it('use ncurc of nested packages with --mergeConfig option', async () => {
        const deepJsonOut = await (0, spawn_please_1.default)('node', [bin, '--jsonUpgraded', '--deep', '--mergeConfig'], { cwd }).then(JSON.parse);
        // root: reject: ['cute-animals']
        deepJsonOut.should.have.property('package.json');
        deepJsonOut['package.json'].should.not.have.property('cute-animals');
        deepJsonOut['package.json'].should.have.property('fp-and-or');
        // pkg1: reject: ['fp-ando-or', 'cute-animals']
        deepJsonOut.should.have.property('pkg/sub1/package.json');
        deepJsonOut['pkg/sub1/package.json'].should.not.have.property('cute-animals');
        deepJsonOut['pkg/sub1/package.json'].should.not.have.property('fp-and-or');
        deepJsonOut['pkg/sub1/package.json'].should.have.property('ncu-test-return-version');
        // pkg2: reject: ['cute-animals']
        deepJsonOut.should.have.property('pkg/sub2/package.json');
        deepJsonOut['pkg/sub2/package.json'].should.not.have.property('cute-animals');
        deepJsonOut['pkg/sub2/package.json'].should.have.property('fp-and-or');
        deepJsonOut['pkg/sub2/package.json'].should.have.property('ncu-test-v2');
        // pkg21: explicit reject: ['fp-ando-or'] and implicit reject ['cute-animals']
        deepJsonOut.should.have.property('pkg/sub2/sub21/package.json');
        deepJsonOut['pkg/sub2/sub21/package.json'].should.not.have.property('cute-animals');
        deepJsonOut['pkg/sub2/sub21/package.json'].should.not.have.property('fp-and-or');
        deepJsonOut['pkg/sub2/sub21/package.json'].should.have.property('ncu-test-return-version');
        // pkg22: implicit reject: ['cute-animals']
        deepJsonOut.should.have.property('pkg/sub2/sub22/package.json');
        deepJsonOut['pkg/sub2/sub22/package.json'].should.not.have.property('cute-animals');
        deepJsonOut['pkg/sub2/sub22/package.json'].should.have.property('fp-and-or');
        deepJsonOut['pkg/sub2/sub22/package.json'].should.have.property('ncu-test-v2');
        // pkg3: reject: ['cute-animals']
        deepJsonOut.should.have.property('pkg/sub3/package.json');
        deepJsonOut['pkg/sub3/package.json'].should.not.have.property('cute-animals');
        deepJsonOut['pkg/sub3/package.json'].should.have.property('fp-and-or');
        deepJsonOut['pkg/sub3/package.json'].should.have.property('ncu-test-v2');
        // pkg31: explicit reject: ['fp-ando-or'] and implicit reject ['cute-animals']
        deepJsonOut.should.have.property('pkg/sub3/sub31/package.json');
        deepJsonOut['pkg/sub3/sub31/package.json'].should.not.have.property('cute-animals');
        deepJsonOut['pkg/sub3/sub31/package.json'].should.not.have.property('fp-and-or');
        deepJsonOut['pkg/sub3/sub31/package.json'].should.have.property('ncu-test-return-version');
        // pkg32: implicit reject: ['cute-animals']
        deepJsonOut.should.have.property('pkg/sub3/sub32/package.json');
        deepJsonOut['pkg/sub3/sub32/package.json'].should.not.have.property('cute-animals');
        deepJsonOut['pkg/sub3/sub32/package.json'].should.have.property('fp-and-or');
        deepJsonOut['pkg/sub3/sub32/package.json'].should.have.property('ncu-test-v2');
    });
    it('merge options', () => {
        /** Asserts that merging two options object deep equals the given result object. */
        const eq = (o1, o2, result) => chai_1.default.expect((0, mergeOptions_1.default)(o1, o2)).to.deep.equal(result);
        // trivial cases
        eq(null, null, {});
        eq({}, {}, {});
        // standard merge not broken
        eq({ a: 1 }, {}, { a: 1 });
        eq({}, { a: 1 }, { a: 1 });
        eq({ a: 1 }, { a: 2 }, { a: 2 });
        // merge arrays (non standard behavior)
        eq({ a: [1] }, { a: [2] }, { a: [1, 2] });
        eq({ a: [1, 2] }, { a: [2, 3] }, { a: [1, 2, 3] });
        // if property types different, then apply standard merge behavior
        eq({ a: 1 }, { a: [2] }, { a: [2] });
        // all together
        eq({ a: [1], b: true, c: 1, d1: 'd1' }, { a: [2], b: false, c: ['1'], d2: 'd2' }, { a: [1, 2], b: false, c: ['1'], d1: 'd1', d2: 'd2' });
    });
});
//# sourceMappingURL=deep.test.js.map