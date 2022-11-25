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
const promises_1 = __importDefault(require("fs/promises"));
const rimraf_1 = __importDefault(require("rimraf"));
const spawn_please_1 = __importDefault(require("spawn-please"));
const logging_1 = require("../lib/logging");
const npm_1 = __importDefault(require("../package-managers/npm"));
const yarn_1 = __importDefault(require("../package-managers/yarn"));
const chalk_1 = __importStar(require("./chalk"));
const upgradePackageData_1 = __importDefault(require("./upgradePackageData"));
/** Run the npm CLI in CI mode. */
const npm = (args, options, print, { spawnOptions } = {}) => {
    if (print) {
        console.log(chalk_1.default.blue([options.packageManager, ...args].join(' ')));
    }
    const spawnOptionsMerged = {
        cwd: options.cwd || process.cwd(),
        env: {
            ...process.env,
            CI: '1',
            FORCE_COLOR: '1',
            ...spawnOptions === null || spawnOptions === void 0 ? void 0 : spawnOptions.env,
        },
        ...spawnOptions,
    };
    const npmOptions = {
        ...(options.global ? { location: 'global' } : null),
        ...(options.prefix ? { prefix: options.prefix } : null),
    };
    return (options.packageManager === 'yarn' ? yarn_1.default : npm_1.default)(args, npmOptions, spawnOptionsMerged);
};
/** Load and validate package file and tests. */
const loadPackageFile = async (options) => {
    var _a;
    let pkg, pkgFile;
    // assert no --packageData or --packageFile
    if (options.packageData || options.packageFile) {
        console.error('--packageData and --packageFile are not allowed with --doctor. You must execute "ncu --doctor" in a directory with a package file so it can install dependencies and test them.');
        process.exit(1);
    }
    // assert package.json
    try {
        pkgFile = await promises_1.default.readFile('package.json', 'utf-8');
        pkg = JSON.parse(pkgFile);
    }
    catch (e) {
        console.error('Missing or invalid package.json');
        process.exit(1);
    }
    // assert npm script "test" (unless a custom test script is specified)
    if (!options.doctorTest && !((_a = pkg.scripts) === null || _a === void 0 ? void 0 : _a.test)) {
        console.error('No npm "test" script defined. You must define a "test" script in the "scripts" section of your package.json to use --doctor.');
        process.exit(1);
    }
    return { pkg, pkgFile };
};
/** Iteratively installs upgrades and runs tests to identify breaking upgrades. */
// we have to pass run directly since it would be a circular require if doctor included this file
const doctor = async (run, options) => {
    var _a;
    await (0, chalk_1.chalkInit)();
    const lockFileName = options.packageManager === 'yarn' ? 'yarn.lock' : 'package-lock.json';
    const { pkg, pkgFile } = await loadPackageFile(options);
    const allDependencies = {
        ...pkg.dependencies,
        ...pkg.devDependencies,
        ...pkg.optionalDependencies,
        ...pkg.bundleDependencies,
    };
    /** Install dependencies using "npm run install" or a custom script given by --doctorInstall. */
    const runInstall = async () => {
        if (options.doctorInstall) {
            const [installCommand, ...testArgs] = options.doctorInstall.split(' ');
            await (0, spawn_please_1.default)(installCommand, testArgs);
        }
        else {
            await npm(['install'], { packageManager: options.packageManager }, true);
        }
    };
    /** Run the tests using "npm run test" or a custom script given by --doctorTest. */
    const runTests = async () => {
        const spawnOptions = {
            stderr: (data) => {
                console.error(chalk_1.default.red(data.toString()));
            },
            // Test runners typically write to stdout, so we need to print stdout.
            // Otherwise test failures will be silenced.
            stdout: (data) => {
                process.stdout.write(data.toString());
            },
        };
        if (options.doctorTest) {
            const [testCommand, ...testArgs] = options.doctorTest.split(' ');
            await (0, spawn_please_1.default)(testCommand, testArgs, spawnOptions);
        }
        else {
            await npm(['run', 'test'], {
                packageManager: options.packageManager,
            }, true, { spawnOptions });
        }
    };
    console.log('Running tests before upgrading');
    // initial install
    await runInstall();
    // save lock file if there is one
    let lockFile = '';
    try {
        lockFile = await promises_1.default.readFile(lockFileName, 'utf-8');
    }
    catch (e) { }
    // make sure current tests pass before we begin
    try {
        await runTests();
    }
    catch (e) {
        console.error('Tests failed before we even got started!');
        process.exit(1);
    }
    if (!options.interactive) {
        console.log(`Upgrading all dependencies and re-running tests`);
    }
    // upgrade all dependencies
    // save upgrades for later in case we need to iterate
    console.log(chalk_1.default.blue('ncu ' +
        process.argv
            .slice(2)
            .filter(arg => arg !== '--doctor')
            .join(' ')));
    process.env.NCU_DOCTOR = '1';
    const upgrades = (await run({
        ...options,
        silent: true,
        // --doctor triggers the initial call to doctor, but the internal call needs to execute npm-check-updates normally in order to upgrade the dependencies
        doctor: false,
    }));
    if (Object.keys(upgrades || {}).length === 0) {
        console.log('All dependencies are up-to-date ' + chalk_1.default.green.bold(':)'));
        return {
            upgrades: {},
            failedUpgrades: {},
        };
    }
    // track if installing dependencies was successful
    // this allows us to skip re-installing when it fails and proceed straight to installing individual dependencies
    let installAllSuccess = false;
    // run tests on all upgrades
    try {
        // install after all upgrades
        await runInstall();
        installAllSuccess = true;
        // run tests after all upgrades
        await runTests();
        console.log(`${chalk_1.default.green('✓')} Tests pass`);
        await (0, logging_1.printUpgrades)(options, {
            current: allDependencies,
            upgraded: upgrades,
            total: Object.keys(upgrades || {}).length,
        });
        console.log(`\n${options.interactive ? 'Chosen' : 'All'} dependencies upgraded and installed ${chalk_1.default.green(':)')}`);
        return {
            upgrades: Object.fromEntries(Object.entries(upgrades).map(([name, version]) => [
                name,
                {
                    newVersion: version,
                    oldVersion: allDependencies[name],
                },
            ])),
            failedUpgrades: {},
        };
    }
    catch {
        console.error(chalk_1.default.red(installAllSuccess ? 'Tests failed' : 'Install failed'));
        console.log(`Identifying broken dependencies`);
        // restore package file, lockFile and re-install
        await promises_1.default.writeFile('package.json', pkgFile);
        if (lockFile) {
            await promises_1.default.writeFile(lockFileName, lockFile);
        }
        else {
            rimraf_1.default.sync(lockFileName);
        }
        // save the last package file with passing tests
        let lastPkgFile = pkgFile;
        // re-install after restoring package file and lock file
        // only re-install if the tests failed, not if npm install failed
        if (installAllSuccess) {
            try {
                await runInstall();
            }
            catch (e) {
                const installCommand = (options.packageManager || 'npm') + ' install';
                throw new Error(`Error: Doctor mode was about to test individual upgrades, but ${chalk_1.default.cyan(installCommand)} failed after rolling back to your existing package and lock files. This is unexpected since the initial install before any upgrades succeeded. Either npm failed to revert a partial install, or failed anomalously on the second run. Please check your internet connection and retry. If doctor mode fails consistently, report a bug with your complete list of dependency versions at https://github.com/raineorshine/npm-check-updates/issues.`);
            }
        }
        const successfulUpgrades = {};
        const failedUpgrades = {};
        // iterate upgrades
        // eslint-disable-next-line fp/no-loops
        for (const [name, version] of Object.entries(upgrades)) {
            try {
                // install single dependency
                const extraArgs = options.doctorSingleInstallArgs ? options.doctorSingleInstallArgs.split(' ') : [];
                await npm([
                    ...(options.packageManager === 'yarn' ? ['add', ...extraArgs] : ['install', '--no-save', ...extraArgs]),
                    `${name}@${version}`,
                ], { packageManager: options.packageManager }, true);
                // if there is a prepare script, we need to run it manually since --no-save does not run prepare automatically
                // https://github.com/raineorshine/npm-check-updates/issues/1170
                if ((_a = pkg.scripts) === null || _a === void 0 ? void 0 : _a.prepare) {
                    try {
                        await npm(['run', 'prepare'], { packageManager: options.packageManager }, true);
                    }
                    catch (e) {
                        console.error(chalk_1.default.red('Prepare script failed'));
                        throw e;
                    }
                }
                // run tests after individual upgrade
                await runTests();
                console.log(`  ${chalk_1.default.green('✓')} ${name} ${allDependencies[name]} → ${version}`);
                // save upgraded package data so that passing versions can still be saved even when there is a failure
                lastPkgFile = await (0, upgradePackageData_1.default)(lastPkgFile, { [name]: allDependencies[name] }, { [name]: version });
                // save working lock file
                lockFile = await promises_1.default.readFile(lockFileName, 'utf-8');
                successfulUpgrades[name] = {
                    oldVersion: allDependencies[name],
                    newVersion: version,
                };
            }
            catch (e) {
                failedUpgrades[name] = {
                    oldVersion: allDependencies[name],
                    newVersion: version,
                };
                // print failing package
                console.error(`  ${chalk_1.default.red('✗')} ${name} ${allDependencies[name]} → ${version}\n`);
                console.error(chalk_1.default.red(e));
                // restore last good lock file
                await promises_1.default.writeFile(lockFileName, lockFile);
                // restore package.json since yarn doesn't have --no-save option
                if (options.packageManager === 'yarn') {
                    await promises_1.default.writeFile('package.json', lastPkgFile);
                }
            }
        }
        // silently restore last passing package file and lock file
        // only print message if package file is updated
        if (lastPkgFile !== pkgFile) {
            console.log('Saving partially upgraded package.json');
            await promises_1.default.writeFile('package.json', lastPkgFile);
        }
        // re-install from restored package.json and lockfile
        await runInstall();
        return {
            upgrades: successfulUpgrades,
            failedUpgrades,
        };
    }
};
exports.default = doctor;
//# sourceMappingURL=doctor.js.map