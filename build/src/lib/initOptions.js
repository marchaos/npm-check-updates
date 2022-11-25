"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const propertyOf_1 = __importDefault(require("lodash/propertyOf"));
const cli_options_1 = __importDefault(require("../cli-options"));
const logging_1 = require("../lib/logging");
const cache_1 = __importDefault(require("./cache"));
const determinePackageManager_1 = __importDefault(require("./determinePackageManager"));
const exists_1 = __importDefault(require("./exists"));
const getPackageFileName_1 = __importDefault(require("./getPackageFileName"));
const programError_1 = __importDefault(require("./programError"));
/** Initializes, validates, sets defaults, and consolidates program options. */
async function initOptions(runOptions, { cli } = {}) {
    var _a, _b;
    const { default: chalkDefault, Chalk } = await import('chalk');
    const chalk = runOptions.color ? new Chalk({ level: 1 }) : chalkDefault;
    // if not executed on the command-line (i.e. executed as a node module), set the defaults
    if (!cli) {
        // set cli defaults since they are not set by commander in this case
        const cliDefaults = cli_options_1.default.reduce((acc, curr) => ({
            ...acc,
            ...(curr.default != null ? { [curr.long]: curr.default } : null),
        }), {});
        // set default options that are specific to module usage
        const moduleDefaults = {
            jsonUpgraded: true,
            silent: runOptions.silent || (runOptions.loglevel === undefined && !runOptions.verbose),
            args: [],
        };
        runOptions = { ...cliDefaults, ...moduleDefaults, ...runOptions };
    }
    // convert packageData to string to convert RunOptions to Options
    const options = {
        ...runOptions,
        ...(runOptions.packageData && typeof runOptions.packageData !== 'string'
            ? { packageData: JSON.stringify(runOptions.packageData, null, 2) }
            : null),
        cli,
    };
    // consolidate loglevel
    const loglevel = options.silent ? 'silent' : options.verbose ? 'verbose' : options.loglevel;
    const json = Object.keys(options)
        .filter(option => option.startsWith('json'))
        .some((0, propertyOf_1.default)(options));
    if (!json && loglevel !== 'silent' && options.rcConfigPath && !options.doctor) {
        (0, logging_1.print)(options, `Using config file ${options.rcConfigPath}`);
    }
    // warn about deprecated options
    const deprecatedOptions = cli_options_1.default.filter(({ long, deprecated }) => deprecated && options[long]);
    if (deprecatedOptions.length > 0) {
        deprecatedOptions.forEach(({ long, description }) => {
            const deprecationMessage = `--${long}: ${description}`;
            (0, logging_1.print)(options, chalk.yellow(deprecationMessage), 'warn');
        });
        (0, logging_1.print)(options, '', 'warn');
    }
    // validate options with predefined choices
    cli_options_1.default.forEach(({ long, choices }) => {
        if (!choices || choices.length === 0)
            return;
        const value = options[long];
        const values = [].concat(value);
        if (values.length === 0)
            return;
        // make sure the option value is valid
        // if an array of values is given, make sure each one is a valid choice
        if (values.every(value => !choices.includes(value))) {
            (0, programError_1.default)(options, chalk.red(`Invalid option value: --${long} ${value}. Valid values are: ${choices.join(', ')}.`));
        }
    });
    // disallow non-matching filter and args
    if (options.filter && (options.args || []).length > 0 && options.filter !== options.args.join(' ')) {
        (0, programError_1.default)(options, chalk.red('Cannot specify a filter using both --filter and args. Did you forget to quote an argument?') +
            '\nSee: https://github.com/raineorshine/npm-check-updates/issues/759#issuecomment-723587297');
    }
    // disallow packageFile and --deep
    else if (options.packageFile && options.deep) {
        (0, programError_1.default)(options, chalk.red(`Cannot specify both --packageFile and --deep. --deep is an alias for --packageFile '**/package.json'`));
    }
    // disallow --workspace and --workspaces
    else if (((_a = options.workspace) === null || _a === void 0 ? void 0 : _a.length) && options.workspaces) {
        (0, programError_1.default)(options, chalk.red('Cannot specify both --workspace and --workspaces.'));
    }
    // disallow --workspace(s) and --deep
    else if (options.deep && (((_b = options.workspace) === null || _b === void 0 ? void 0 : _b.length) || options.workspaces)) {
        (0, programError_1.default)(options, chalk.red(`Cannot specify both --deep and --workspace${options.workspaces ? 's' : ''}.`));
    }
    // disallow incorrect or missing registry path when selecting staticRegistry as packageManager
    if (options.packageManager === 'staticRegistry') {
        if (options.registry === undefined || options.registry === null) {
            (0, programError_1.default)(options, chalk.red('When --package-manager staticRegistry is specified, you must provide the path for the registry file with --registry. Run "ncu --help --packageManager" for details.'));
        }
        if (!(await (0, exists_1.default)(options.registry))) {
            (0, programError_1.default)(options, chalk.red(`The specified static registry file does not exist: ${options.registry}`));
        }
    }
    const target = options.target || 'latest';
    const autoPre = target === 'newest' || target === 'greatest';
    const format = options.format || [];
    const packageManager = await (0, determinePackageManager_1.default)(options);
    // only print 'Using yarn' when autodetected
    if (!options.packageManager && packageManager === 'yarn') {
        (0, logging_1.print)(options, 'Using yarn');
    }
    const resolvedOptions = {
        ...options,
        ...(options.deep ? { packageFile: `**/${(0, getPackageFileName_1.default)(options)}` } : null),
        ...((options.args || []).length > 0 ? { filter: options.args.join(' ') } : null),
        ...(format.length > 0 ? { format } : null),
        // add shortcut for any keys that start with 'json'
        json,
        loglevel,
        minimal: options.minimal === undefined ? false : options.minimal,
        // default to false, except when newest or greatest are set
        // this is overriden on a per-dependency basis in queryVersions to allow prereleases to be upgraded to newer prereleases
        ...(options.pre != null || autoPre ? { pre: options.pre != null ? !!options.pre : autoPre } : null),
        target,
        // imply upgrade in interactive mode when json is not specified as the output
        ...(options.interactive && options.upgrade === undefined ? { upgrade: !json } : null),
        packageManager,
    };
    resolvedOptions.cacher = await (0, cache_1.default)(resolvedOptions);
    return resolvedOptions;
}
exports.default = initOptions;
//# sourceMappingURL=initOptions.js.map