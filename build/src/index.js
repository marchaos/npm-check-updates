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
exports.getNcuRc = exports.run = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const globby_1 = __importDefault(require("globby"));
const isString_1 = __importDefault(require("lodash/isString"));
const path_1 = __importDefault(require("path"));
const prompts_ncu_1 = __importDefault(require("prompts-ncu"));
const spawn_please_1 = __importDefault(require("spawn-please"));
const untildify_1 = __importDefault(require("untildify"));
const cli_options_1 = require("./cli-options");
const cache_1 = require("./lib/cache");
const chalk_1 = __importStar(require("./lib/chalk"));
const doctor_1 = __importDefault(require("./lib/doctor"));
const exists_1 = __importDefault(require("./lib/exists"));
const findPackage_1 = __importDefault(require("./lib/findPackage"));
const getNcuRc_1 = __importDefault(require("./lib/getNcuRc"));
exports.getNcuRc = getNcuRc_1.default;
const getPackageFileName_1 = __importDefault(require("./lib/getPackageFileName"));
const initOptions_1 = __importDefault(require("./lib/initOptions"));
const logging_1 = require("./lib/logging");
const mergeOptions_1 = __importDefault(require("./lib/mergeOptions"));
const programError_1 = __importDefault(require("./lib/programError"));
const runGlobal_1 = __importDefault(require("./lib/runGlobal"));
const runLocal_1 = __importDefault(require("./lib/runLocal"));
const package_managers_1 = __importDefault(require("./package-managers"));
// allow prompt injection from environment variable for testing purposes
if (process.env.INJECT_PROMPTS) {
    prompts_ncu_1.default.inject(JSON.parse(process.env.INJECT_PROMPTS));
}
// Exit with non-zero error code when there is an unhandled promise rejection.
// Use `node --trace-uncaught ...` to show where the exception was thrown.
// See: https://nodejs.org/api/process.html#event-unhandledrejection
process.on('unhandledRejection', (reason) => {
    // do not rethrow, as there may be other errors to print out
    console.error(reason);
});
/**
 * Volta is a tool for managing JavaScript tooling like Node and npm. Volta has
 * its own system for installing global packages which circumvents npm, so
 * commands like `npm ls -g` do not accurately reflect what is installed.
 *
 * The ability to use `npm ls -g` is tracked in this Volta issue: https://github.com/volta-cli/volta/issues/1012
 */
function checkIfVolta(options) {
    var _a;
    // The first check is for macOS/Linux and the second check is for Windows
    if (options.global && (!!process.env.VOLTA_HOME || ((_a = process.env.PATH) === null || _a === void 0 ? void 0 : _a.includes('\\Volta')))) {
        const message = 'It appears you are using Volta. `npm-check-updates --global` ' +
            'cannot be used with Volta because Volta has its own system for ' +
            'managing global packages which circumvents npm.\n\n' +
            'If you are still receiving this message after uninstalling Volta, ' +
            'ensure your PATH does not contain an entry for Volta and your ' +
            'shell profile does not define VOLTA_HOME. You may need to reboot ' +
            'for changes to your shell profile to take effect.';
        (0, logging_1.print)(options, message, 'error');
        process.exit(1);
    }
}
/** Returns the package manager that should be used to install packages after running "ncu -u". Detects pnpm via pnpm-lock.yarn. This is the one place that pnpm needs to be detected, since otherwise it is backwards compatible with npm. */
const getPackageManagerForInstall = async (options, pkgFile) => {
    var _a;
    if (options.packageManager === 'yarn')
        return 'yarn';
    const cwd = ((_a = options.cwd) !== null && _a !== void 0 ? _a : pkgFile) ? `${pkgFile}/..` : process.cwd();
    const pnpmLockFile = path_1.default.join(cwd, 'pnpm-lock.yaml');
    const pnpm = await (0, exists_1.default)(pnpmLockFile);
    return pnpm ? 'pnpm' : 'npm';
};
/** Either suggest an install command based on the package manager, or in interactive mode, prompt to autoinstall. */
const npmInstall = async (pkgs, analysis, options) => {
    // if no packages were upgraded (i.e. all dependencies deselected in interactive mode), then bail without suggesting an install.
    // normalize the analysis for one or many packages
    const analysisNormalized = pkgs.length === 1 ? { [pkgs[0]]: analysis } : analysis;
    const someUpgraded = Object.values(analysisNormalized).some(upgrades => Object.keys(upgrades).length > 0);
    if (!someUpgraded)
        return;
    // for the purpose of the install hint, just use the package manager used in the first subproject
    // if autoinstalling, the actual package manager in each subproject will be used
    const packageManager = await getPackageManagerForInstall(options, pkgs[0]);
    // by default, show an install hint after upgrading
    // this will be disabled in interactive mode if the user chooses to have npm-check-updates execute the install command
    const installHint = `Run ${chalk_1.default.cyan(packageManager + ' install')}${pkgs.length > 1 && !options.workspace && !options.workspaces ? ' in each project directory' : ''} to install new versions`;
    // prompt the user if they want ncu to run "npm install"
    if (options.interactive && !process.env.NCU_DOCTOR) {
        console.info('');
        const response = await (0, prompts_ncu_1.default)({
            type: 'confirm',
            name: 'value',
            message: `${installHint}?`,
            initial: true,
            // allow Ctrl+C to kill the process
            onState: (state) => {
                if (state.aborted) {
                    process.nextTick(() => process.exit(1));
                }
            },
        });
        // autoinstall
        if (response.value) {
            pkgs.forEach(async (pkgFile) => {
                const packageManager = await getPackageManagerForInstall(options, pkgFile);
                const cmd = packageManager + (process.platform === 'win32' ? '.cmd' : '');
                const cwd = options.cwd || path_1.default.resolve(pkgFile, '..');
                let stdout = '';
                try {
                    await (0, spawn_please_1.default)(cmd, ['install'], {
                        cwd,
                        ...(packageManager === 'pnpm'
                            ? {
                                env: {
                                    ...process.env,
                                    // With spawn, pnpm install will fail with ERR_PNPM_PEER_DEP_ISSUES  Unmet peer dependencies.
                                    // When pnpm install is run directly from the terminal, this error does not occur.
                                    // When pnpm install is run from a simple spawn script, this error does not occur.
                                    // The issue only seems to be when pnpm install is executed from npm-check-updates, but it's not clear what configuration or environmental factors are causing this.
                                    // For now, turn off strict-peer-dependencies on pnpm autoinstall.
                                    // See: https://github.com/raineorshine/npm-check-updates/issues/1191
                                    npm_config_strict_peer_dependencies: false,
                                },
                            }
                            : null),
                        stdout: (data) => {
                            stdout += data;
                        },
                    });
                    (0, logging_1.print)(options, stdout, 'verbose');
                }
                catch (err) {
                    // sometimes packages print errors to stdout instead of stderr
                    // if there is nothing on stderr, reject with stdout
                    throw new Error((err === null || err === void 0 ? void 0 : err.message) || err || stdout);
                }
            });
        }
    }
    // show the install hint unless autoinstall occurred
    else {
        (0, logging_1.print)(options, `\n${installHint}.`);
    }
};
/** Main entry point.
 *
 * @returns Promise<
 * PackageFile                    Default returns upgraded package file.
 * | Index<VersionSpec>    --jsonUpgraded returns only upgraded dependencies.
 * | void                         --global upgrade returns void.
 * >
 */
async function run(runOptions = {}, { cli } = {}) {
    const options = await (0, initOptions_1.default)(runOptions, { cli });
    // chalk may already have been initialized in cli.ts, but when imported as a module
    // chalkInit is idempotent
    await (0, chalk_1.chalkInit)(options.color);
    checkIfVolta(options);
    (0, logging_1.print)(options, 'Initializing', 'verbose');
    if (options.cacheClear) {
        await (0, cache_1.cacheClear)(options);
    }
    if (options.packageManager === 'npm' && !options.prefix) {
        options.prefix = await package_managers_1.default.npm.defaultPrefix(options);
    }
    if (options.packageManager === 'yarn' && !options.prefix) {
        options.prefix = await package_managers_1.default.yarn.defaultPrefix(options);
    }
    let timeout;
    let timeoutPromise = new Promise(() => null);
    if (options.timeout) {
        const timeoutMs = (0, isString_1.default)(options.timeout) ? Number.parseInt(options.timeout, 10) : options.timeout;
        timeoutPromise = new Promise((resolve, reject) => {
            timeout = setTimeout(() => {
                // must catch the error and reject explicitly since we are in a setTimeout
                const error = `Exceeded global timeout of ${timeoutMs}ms`;
                reject(error);
                try {
                    (0, programError_1.default)(options, chalk_1.default.red(error));
                }
                catch (e) {
                    /* noop */
                }
            }, timeoutMs);
        });
    }
    /** Runs the dependency upgrades. Loads the ncurc, finds the package file, and handles --deep. */
    async function runUpgrades() {
        var _a, _b, _c, _d;
        const defaultPackageFilename = (0, getPackageFileName_1.default)(options);
        // Workspace package names
        // These will be used to filter out local workspace packages so they are not fetched from the registry.
        let workspacePackages = [];
        // Find the package file with globby.
        // When in workspaces mode, only include the root project package file when --root is used.
        let pkgs = (!options.workspaces && !((_a = options.workspace) === null || _a === void 0 ? void 0 : _a.length)) || options.root
            ? globby_1.default.sync(options.cwd
                ? path_1.default.resolve((0, untildify_1.default)(options.cwd), defaultPackageFilename).replace(/\\/g, '/') // convert Windows path to *nix path for globby
                : defaultPackageFilename, {
                ignore: ['**/node_modules/**'],
            })
            : [];
        // workspaces
        if (options.workspaces || ((_b = options.workspace) === null || _b === void 0 ? void 0 : _b.length)) {
            // use silent, otherwise there will be a duplicate "Checking" message
            const [pkgData] = await (0, findPackage_1.default)({ ...options, packageFile: defaultPackageFilename, loglevel: 'silent' });
            const pkgDataParsed = typeof pkgData === 'string' ? JSON.parse(pkgData) : pkgData;
            const workspaces = Array.isArray(pkgDataParsed.workspaces)
                ? pkgDataParsed.workspaces
                : (_c = pkgDataParsed.workspaces) === null || _c === void 0 ? void 0 : _c.packages;
            if (!workspaces) {
                (0, programError_1.default)(options, chalk_1.default.red(`workspaces property missing from package.json. --workspace${options.workspaces ? 's' : ''} only works when you specify a "workspaces" property in your package.json.`));
            }
            // build a glob from the workspaces
            const workspacePackageGlob = (workspaces || []).map(workspace => path_1.default
                .join(workspace, defaultPackageFilename)
                // convert Windows path to *nix path for globby
                .replace(/\\/g, '/'));
            // e.g. [packages/a/package.json, ...]
            const workspacePackageFiles = [
                ...globby_1.default.sync(workspacePackageGlob, {
                    ignore: ['**/node_modules/**'],
                }),
            ];
            // Get the package names from the package files.
            // If a package does not have a name, use the folder name.
            // These will be used to filter out local workspace packages so they are not fetched from the registry.
            workspacePackages = await Promise.all(workspacePackageFiles.map(async (file) => {
                const packageFile = await promises_1.default.readFile(file, 'utf-8');
                const pkg = JSON.parse(packageFile);
                return pkg.name || file.split('/').slice(-2)[0];
            }));
            // add workspace packages
            pkgs = [
                ...pkgs,
                ...(options.workspaces
                    ? // --workspaces
                        workspacePackageFiles
                    : // --workspace
                        workspacePackageFiles.filter(pkgFile => {
                            var _a;
                            return (_a = options.workspace) === null || _a === void 0 ? void 0 : _a.some(workspace => workspaces === null || workspaces === void 0 ? void 0 : workspaces.some(workspacePattern => pkgFile === path_1.default.join(path_1.default.dirname(workspacePattern), workspace, defaultPackageFilename)));
                        })),
            ];
        }
        // enable deep mode if --deep, --workspace, --workspaces, or if multiple package files are found
        const isWorkspace = options.workspaces || !!((_d = options.workspace) === null || _d === void 0 ? void 0 : _d.length);
        options.deep = options.deep || isWorkspace || pkgs.length > 1;
        let analysis;
        if (options.global) {
            const analysis = await (0, runGlobal_1.default)(options);
            clearTimeout(timeout);
            return analysis;
        }
        else if (options.deep) {
            analysis = await pkgs.reduce(async (previousPromise, packageFile) => {
                const packages = await previousPromise;
                // copy object to prevent share .ncurc options between different packageFile, to prevent unpredictable behavior
                const rcResult = await (0, getNcuRc_1.default)({ packageFile, color: options.color });
                let rcConfig = rcResult && rcResult.config ? rcResult.config : {};
                if (options.mergeConfig && Object.keys(rcConfig).length) {
                    // Merge config options.
                    rcConfig = (0, mergeOptions_1.default)(options, rcConfig);
                }
                const pkgOptions = {
                    ...options,
                    ...rcConfig,
                    packageFile,
                    workspacePackages,
                };
                const [pkgData, pkgFile] = await (0, findPackage_1.default)(pkgOptions);
                return {
                    ...packages,
                    // index by relative path if cwd was specified
                    [pkgOptions.cwd
                        ? path_1.default
                            .relative(path_1.default.resolve(pkgOptions.cwd), pkgFile)
                            // convert Windows path to *nix path for consistency
                            .replace(/\\/g, '/')
                        : pkgFile]: await (0, runLocal_1.default)(pkgOptions, pkgData, pkgFile),
                };
            }, Promise.resolve({}));
            if (options.json) {
                (0, logging_1.printJson)(options, analysis);
            }
        }
        else {
            // Mutate packageFile when glob pattern finds only single package
            if (pkgs.length === 1 && pkgs[0] !== defaultPackageFilename) {
                options.packageFile = pkgs[0];
            }
            const [pkgData, pkgFile] = await (0, findPackage_1.default)(options);
            analysis = await (0, runLocal_1.default)(options, pkgData, pkgFile);
        }
        clearTimeout(timeout);
        // suggest install command or autoinstall
        if (options.upgrade) {
            // if workspaces, install from root project folder
            await npmInstall(isWorkspace ? ['package.json'] : pkgs, analysis, options);
        }
        return analysis;
    }
    // doctor mode
    if (options.doctor) {
        // execute with -u
        if (options.upgrade) {
            // we have to pass run directly since it would be a circular require if doctor included this file
            return Promise.race([timeoutPromise, (0, doctor_1.default)(run, options)]);
        }
        // print help otherwise
        else {
            (0, logging_1.print)(options, `Usage: ncu --doctor\n\n${cli_options_1.cliOptionsMap.doctor.help()}`, 'warn');
        }
    }
    // normal mode
    else {
        return Promise.race([timeoutPromise, runUpgrades()]);
    }
}
exports.run = run;
exports.default = run;
//# sourceMappingURL=index.js.map