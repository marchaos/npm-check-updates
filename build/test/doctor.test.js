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
const rimraf_1 = __importDefault(require("rimraf"));
const spawn_please_1 = __importDefault(require("spawn-please"));
const cli_options_1 = require("../src/cli-options");
const chalk_1 = require("../src/lib/chalk");
chai_1.default.should();
chai_1.default.use(chai_as_promised_1.default);
chai_1.default.use(chai_string_1.default);
process.env.NCU_TESTS = 'true';
const bin = path_1.default.join(__dirname, '../build/src/bin/cli.js');
const doctorTests = path_1.default.join(__dirname, 'doctor');
/** Run the ncu CLI. */
const ncu = (args, options) => (0, spawn_please_1.default)('node', [bin, ...args], options);
/** Assertions for npm or yarn when tests pass. */
const testPass = ({ packageManager }) => {
    it('upgrade dependencies when tests pass', async function () {
        // use dynamic import for ESM module
        const { default: stripAnsi } = await import('strip-ansi');
        const cwd = path_1.default.join(doctorTests, 'pass');
        const pkgPath = path_1.default.join(cwd, 'package.json');
        const nodeModulesPath = path_1.default.join(cwd, 'node_modules');
        const lockfilePath = path_1.default.join(cwd, packageManager === 'npm' ? 'package-lock.json' : 'yarn.lock');
        const pkgOriginal = await promises_1.default.readFile(path_1.default.join(cwd, 'package.json'), 'utf-8');
        let stdout = '';
        let stderr = '';
        // touch yarn.lock (see pass/README)
        if (packageManager === 'yarn') {
            await promises_1.default.writeFile(lockfilePath, '');
        }
        try {
            // explicitly set packageManager to avoid auto yarn detection
            await ncu(['--doctor', '-u', '-p', packageManager], {
                cwd,
                stdout: function (data) {
                    stdout += data;
                },
                stderr: function (data) {
                    stderr += data;
                },
            });
        }
        catch (e) { }
        const pkgUpgraded = await promises_1.default.readFile(pkgPath, 'utf-8');
        // cleanup before assertions in case they fail
        await promises_1.default.writeFile(pkgPath, pkgOriginal);
        rimraf_1.default.sync(nodeModulesPath);
        rimraf_1.default.sync(lockfilePath);
        // delete yarn cache
        if (packageManager === 'yarn') {
            rimraf_1.default.sync(path_1.default.join(cwd, '.yarn'));
            rimraf_1.default.sync(path_1.default.join(cwd, '.pnp.js'));
        }
        // stdout should include normal output
        stderr.should.equal('');
        stripAnsi(stdout).should.containIgnoreCase('Tests pass');
        stripAnsi(stdout).should.containIgnoreCase('ncu-test-v2  ~1.0.0  →  ~2.0.0');
        // stderr should include first failing upgrade
        stderr.should.equal('');
        // package file should include upgrades
        pkgUpgraded.should.containIgnoreCase('"ncu-test-v2": "~2.0.0"');
    });
};
/** Assertions for npm or yarn when tests fail. */
const testFail = ({ packageManager }) => {
    it('identify broken upgrade', async function () {
        const cwd = path_1.default.join(doctorTests, 'fail');
        const pkgPath = path_1.default.join(cwd, 'package.json');
        const nodeModulesPath = path_1.default.join(cwd, 'node_modules');
        const lockfilePath = path_1.default.join(cwd, packageManager === 'npm' ? 'package-lock.json' : 'yarn.lock');
        const pkgOriginal = await promises_1.default.readFile(path_1.default.join(cwd, 'package.json'), 'utf-8');
        let stdout = '';
        let stderr = '';
        let pkgUpgraded;
        // touch yarn.lock (see fail/README)
        if (packageManager === 'yarn') {
            await promises_1.default.writeFile(lockfilePath, '');
        }
        try {
            // explicitly set packageManager to avoid auto yarn detection
            await ncu(['--doctor', '-u', '-p', packageManager], {
                cwd,
                stdout: function (data) {
                    stdout += data;
                },
                stderr: function (data) {
                    stderr += data;
                },
            });
        }
        finally {
            pkgUpgraded = await promises_1.default.readFile(pkgPath, 'utf-8');
            await promises_1.default.writeFile(pkgPath, pkgOriginal);
            rimraf_1.default.sync(nodeModulesPath);
            rimraf_1.default.sync(lockfilePath);
            // delete yarn cache
            if (packageManager === 'yarn') {
                rimraf_1.default.sync(path_1.default.join(cwd, '.yarn'));
                rimraf_1.default.sync(path_1.default.join(cwd, '.pnp.js'));
            }
        }
        // stdout should include successful upgrades
        stdout.should.containIgnoreCase('ncu-test-v2 ~1.0.0 →');
        stdout.should.not.include('ncu-test-return-version ~1.0.0 →');
        stdout.should.containIgnoreCase('emitter20 1.0.0 →');
        // stderr should include first failing upgrade
        stderr.should.containIgnoreCase('Breaks with v2.x');
        stderr.should.not.include('ncu-test-v2 ~1.0.0 →');
        stderr.should.containIgnoreCase('ncu-test-return-version ~1.0.0 →');
        stderr.should.not.include('emitter20 1.0.0 →');
        // package file should only include successful upgrades
        pkgUpgraded.should.containIgnoreCase('"ncu-test-v2": "~2.0.0"');
        pkgUpgraded.should.containIgnoreCase('"ncu-test-return-version": "~1.0.0"');
        pkgUpgraded.should.not.include('"emitter20": "1.0.0"'); // assert the negation since emitter20 is a live package and the latest version could change (it would be better to mock this)
    });
};
describe('doctor', function () {
    // 3 min timeout
    this.timeout(3 * 60 * 1000);
    describe('npm', () => {
        it('print instructions when -u is not specified', async () => {
            await (0, chalk_1.chalkInit)();
            const { default: stripAnsi } = await import('strip-ansi');
            const cwd = path_1.default.join(doctorTests, 'nopackagefile');
            const output = await ncu(['--doctor'], { cwd });
            return stripAnsi(output).should.equal(`Usage: ncu --doctor\n\n${stripAnsi(cli_options_1.cliOptionsMap.doctor.help())}\n`);
        });
        it('throw an error if there is no package file', async () => {
            const cwd = path_1.default.join(doctorTests, 'nopackagefile');
            return ncu(['--doctor', '-u'], { cwd }).should.eventually.be.rejectedWith('Missing or invalid package.json');
        });
        it('throw an error if there is no test script', async () => {
            const cwd = path_1.default.join(doctorTests, 'notestscript');
            return ncu(['--doctor', '-u'], { cwd }).should.eventually.be.rejectedWith('No npm "test" script');
        });
        it('throw an error if --packageData or --packageFile are supplied', async () => {
            return Promise.all([
                ncu(['--doctor', '-u', '--packageFile', 'package.json']).should.eventually.be.rejectedWith('--packageData and --packageFile are not allowed with --doctor'),
                ncu(['--doctor', '-u', '--packageData', '{}']).should.eventually.be.rejectedWith('--packageData and --packageFile are not allowed with --doctor'),
            ]);
        });
        testPass({ packageManager: 'npm' });
        testFail({ packageManager: 'npm' });
        it('pass through options', async function () {
            // use dynamic import for ESM module
            const { default: stripAnsi } = await import('strip-ansi');
            const cwd = path_1.default.join(doctorTests, 'options');
            const pkgPath = path_1.default.join(cwd, 'package.json');
            const lockfilePath = path_1.default.join(cwd, 'package-lock.json');
            const nodeModulesPath = path_1.default.join(cwd, 'node_modules');
            const pkgOriginal = await promises_1.default.readFile(path_1.default.join(cwd, 'package.json'), 'utf-8');
            let stdout = '';
            let stderr = '';
            try {
                // check only ncu-test-v2 (excluding ncu-return-version)
                await ncu(['--doctor', '-u', '--filter', 'ncu-test-v2'], {
                    cwd,
                    stdout: function (data) {
                        stdout += data;
                    },
                    stderr: function (data) {
                        stderr += data;
                    },
                });
            }
            catch (e) { }
            const pkgUpgraded = await promises_1.default.readFile(pkgPath, 'utf-8');
            // cleanup before assertions in case they fail
            await promises_1.default.writeFile(pkgPath, pkgOriginal);
            rimraf_1.default.sync(lockfilePath);
            rimraf_1.default.sync(nodeModulesPath);
            // stderr should be empty
            stderr.should.equal('');
            // stdout should include normal output
            stripAnsi(stdout).should.containIgnoreCase('Tests pass');
            stripAnsi(stdout).should.containIgnoreCase('ncu-test-v2  ~1.0.0  →  ~2.0.0');
            // package file should include upgrades
            pkgUpgraded.should.containIgnoreCase('"ncu-test-v2": "~2.0.0"');
        });
        it('custom install script with --doctorInstall', async function () {
            // use dynamic import for ESM module
            const { default: stripAnsi } = await import('strip-ansi');
            const cwd = path_1.default.join(doctorTests, 'custominstall');
            const pkgPath = path_1.default.join(cwd, 'package.json');
            const lockfilePath = path_1.default.join(cwd, 'package-lock.json');
            const nodeModulesPath = path_1.default.join(cwd, 'node_modules');
            const pkgOriginal = await promises_1.default.readFile(path_1.default.join(cwd, 'package.json'), 'utf-8');
            const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
            let stdout = '';
            let stderr = '';
            try {
                await ncu(['--doctor', '-u', '--doctorInstall', npmCmd + ' run myinstall'], {
                    cwd,
                    stdout: function (data) {
                        stdout += data;
                    },
                    stderr: function (data) {
                        stderr += data;
                    },
                });
            }
            catch (e) { }
            const pkgUpgraded = await promises_1.default.readFile(pkgPath, 'utf-8');
            // cleanup before assertions in case they fail
            await promises_1.default.writeFile(pkgPath, pkgOriginal);
            rimraf_1.default.sync(lockfilePath);
            rimraf_1.default.sync(nodeModulesPath);
            // stderr should be empty
            stderr.should.equal('');
            // stdout should include normal output
            stripAnsi(stdout).should.containIgnoreCase('Tests pass');
            // package file should include upgrades
            pkgUpgraded.should.containIgnoreCase('"ncu-test-v2": "~2.0.0"');
        });
        it('custom test script with --doctorTest', async function () {
            // use dynamic import for ESM module
            const { default: stripAnsi } = await import('strip-ansi');
            const cwd = path_1.default.join(doctorTests, 'customtest');
            const pkgPath = path_1.default.join(cwd, 'package.json');
            const lockfilePath = path_1.default.join(cwd, 'package-lock.json');
            const nodeModulesPath = path_1.default.join(cwd, 'node_modules');
            const pkgOriginal = await promises_1.default.readFile(path_1.default.join(cwd, 'package.json'), 'utf-8');
            const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
            let stdout = '';
            let stderr = '';
            try {
                await ncu(['--doctor', '-u', '--doctorTest', npmCmd + ' run mytest'], {
                    cwd,
                    stdout: function (data) {
                        stdout += data;
                    },
                    stderr: function (data) {
                        stderr += data;
                    },
                });
            }
            catch (e) { }
            const pkgUpgraded = await promises_1.default.readFile(pkgPath, 'utf-8');
            // cleanup before assertions in case they fail
            await promises_1.default.writeFile(pkgPath, pkgOriginal);
            rimraf_1.default.sync(lockfilePath);
            rimraf_1.default.sync(nodeModulesPath);
            // stderr should be empty
            stderr.should.equal('');
            // stdout should include normal output
            stripAnsi(stdout).should.containIgnoreCase('Tests pass');
            // package file should include upgrades
            pkgUpgraded.should.containIgnoreCase('"ncu-test-v2": "~2.0.0"');
        });
        it('handle failed prepare script', async () => {
            const tempDir = await promises_1.default.mkdtemp(path_1.default.join(os_1.default.tmpdir(), 'npm-check-updates-'));
            const pkgPath = path_1.default.join(tempDir, 'package.json');
            await promises_1.default.mkdtemp(path_1.default.join(os_1.default.tmpdir(), 'npm-check-updates-'));
            /*
              - packagu.json
              - tsconfig.json
              - src/
                - index.ts
            */
            // package.json
            await promises_1.default.writeFile(pkgPath, JSON.stringify({
                scripts: {
                    prepare: 'tsc',
                    test: 'echo "No tests"',
                },
                devDependencies: {
                    '@types/node': '18.0.0',
                    typescript: '4.7.4',
                },
                dependencies: {
                    '@kayahr/eddb': '^1.0.0',
                },
            }), 'utf-8');
            // tsconfig.json
            await promises_1.default.writeFile(path_1.default.join(tempDir, 'tsconfig.json'), JSON.stringify({
                compilerOptions: {
                    rootDir: 'src',
                    outDir: 'lib',
                },
            }), 'utf-8');
            // src/index.ts
            await promises_1.default.mkdir(path_1.default.join(tempDir, 'src'));
            await promises_1.default.writeFile(path_1.default.join(tempDir, 'src/index.ts'), `import { createFactories } from "@kayahr/eddb"

console.log(createFactories())`, 'utf-8');
            let stdout = '';
            let stderr = '';
            let pkgUpgraded;
            try {
                // explicitly set packageManager to avoid auto yarn detection
                await (0, spawn_please_1.default)('npm', ['install'], { cwd: tempDir });
                await ncu(['--doctor', '-u', '-p', 'npm'], {
                    cwd: tempDir,
                    stdout: function (data) {
                        stdout += data;
                    },
                    stderr: function (data) {
                        stderr += data;
                    },
                });
                pkgUpgraded = JSON.parse(await promises_1.default.readFile(pkgPath, 'utf-8'));
            }
            finally {
                await promises_1.default.rm(tempDir, { recursive: true, force: true });
            }
            // stdout should include successful upgrades
            stdout.should.containIgnoreCase('@types/node 18.0.0 →');
            stdout.should.not.containIgnoreCase('@kayahr/eddb ^1.0.0 →');
            // stderr should include failed prepare script
            stderr.should.containIgnoreCase('Prepare script failed');
            stderr.should.containIgnoreCase('@kayahr/eddb ^1.0.0 →');
            stderr.should.not.containIgnoreCase('@types/node → 18.0.0');
            // package file should only include successful upgrades
            pkgUpgraded.dependencies.should.deep.equal({
                '@kayahr/eddb': '^1.0.0',
            });
            pkgUpgraded.devDependencies.should.not.deep.equal({
                '@types/node': '18.0.0',
            });
        });
    });
    describe('yarn', () => {
        testPass({ packageManager: 'yarn' });
        testFail({ packageManager: 'yarn' });
    });
});
//# sourceMappingURL=doctor.test.js.map