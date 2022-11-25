"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.printIgnoredUpdates = exports.printUpgrades = exports.printUpgradesTable = exports.toDependencyTable = exports.printJson = exports.print = void 0;
/**
 * Loggin functions.
 */
const cli_table_1 = __importDefault(require("cli-table"));
const chalk_1 = __importDefault(require("./chalk"));
const filterObject_1 = __importDefault(require("./filterObject"));
const getRepoUrl_1 = __importDefault(require("./getRepoUrl"));
const version_util_1 = require("./version-util");
// maps string levels to numeric levels
const logLevels = {
    silent: 0,
    error: 1,
    minimal: 2,
    warn: 3,
    info: 4,
    verbose: 5,
    silly: 6,
};
/** Returns true if the dependency spec is not fetchable from the registry and is ignored. */
const isFetchable = (spec) => 
// local file protocol
!spec.startsWith('file:') &&
    // link protocol
    !spec.startsWith('link:') &&
    // short github urls that are ignored, e.g. raineorshine/foo
    !/^[^/:@]+\/\w+/.test(spec);
/**
 * Prints a message if it is included within options.loglevel.
 *
 * @param options    Command line options. These will be compared to the loglevel parameter to determine if the message gets printed.
 * @param message    The message to print
 * @param loglevel   silent|error|warn|info|verbose|silly
 * @param method     The console method to call. Default: 'log'.
 */
function print(options, message, loglevel = null, method = 'log') {
    var _a;
    // not in json mode
    // not silent
    // not at a loglevel under minimum specified
    if (!options.json &&
        options.loglevel !== 'silent' &&
        (loglevel == null ||
            logLevels[((_a = options.loglevel) !== null && _a !== void 0 ? _a : 'warn')] >= logLevels[loglevel])) {
        console[method](message);
    }
}
exports.print = print;
/** Pretty print a JSON object. */
function printJson(options, object) {
    if (options.loglevel !== 'silent') {
        console.log(JSON.stringify(object, null, 2));
    }
}
exports.printJson = printJson;
/** Create a table with the appropriate columns and alignment to render dependency upgrades. */
function renderDependencyTable(rows) {
    const table = new cli_table_1.default({
        colAligns: ['left', 'right', 'right', 'right', 'left', 'left'],
        chars: {
            top: '',
            'top-mid': '',
            'top-left': '',
            'top-right': '',
            bottom: '',
            'bottom-mid': '',
            'bottom-left': '',
            'bottom-right': '',
            left: '',
            'left-mid': '',
            mid: '',
            'mid-mid': '',
            right: '',
            'right-mid': '',
            middle: '',
        },
        rows,
        // TODO: Submit a PR for rows in @types/cli-table
        // https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/cli-table/index.d.ts
    });
    // when border is removed, whitespace remains
    // trim the end of each line to remove whitespace
    // this makes no difference visually, but the whitespace interacts poorly with .editorconfig in tests
    return table
        .toString()
        .split('\n')
        .map(line => line.trimEnd())
        .join('\n');
}
/**
 * Extract just the version number from a package.json dep
 *
 * @param dep Raw dependency, could be version / npm: string / Git url
 */
function getVersion(dep) {
    return (0, version_util_1.isGithubUrl)(dep) ? (0, version_util_1.getGithubUrlTag)(dep) : (0, version_util_1.isNpmAlias)(dep) ? (0, version_util_1.parseNpmAlias)(dep)[1] : dep;
}
/**
 * Renders a color-coded table of upgrades.
 *
 * @param args
 * @param args.from
 * @param args.to
 * @param args.ownersChangedDeps
 * @param args.format
 */
async function toDependencyTable({ from: fromDeps, to: toDeps, ownersChangedDeps, format, }) {
    const table = renderDependencyTable(await Promise.all(
    // eslint-disable-next-line fp/no-mutating-methods
    Object.keys(toDeps)
        .sort()
        .map(async (dep) => {
        const from = fromDeps[dep] || '';
        const toRaw = toDeps[dep] || '';
        const to = getVersion(toRaw);
        const ownerChanged = ownersChangedDeps
            ? dep in ownersChangedDeps
                ? ownersChangedDeps[dep]
                    ? '*owner changed*'
                    : ''
                : '*unknown*'
            : '';
        const toColorized = (0, version_util_1.colorizeDiff)(getVersion(from), to);
        const repoUrl = (format === null || format === void 0 ? void 0 : format.includes('repo')) ? (await (0, getRepoUrl_1.default)(dep)) || '' : '';
        return [dep, from, '→', toColorized, ownerChanged, repoUrl];
    })));
    return table;
}
exports.toDependencyTable = toDependencyTable;
/**
 * Renders one or more color-coded tables with all upgrades. Supports different formats from the --format option.
 *
 * @param args
 * @param args.current
 * @param args.upgraded
 * @param args.ownersChangedDeps
 * @param options
 */
async function printUpgradesTable({ current, upgraded, ownersChangedDeps, }, options) {
    var _a;
    // group
    if ((_a = options.format) === null || _a === void 0 ? void 0 : _a.includes('group')) {
        const groups = (0, version_util_1.getDependencyGroups)(upgraded, current, options);
        // eslint-disable-next-line fp/no-loops -- We must await in each iteration of the loop
        for (const { heading, packages } of groups) {
            print(options, '\n' + heading);
            print(options, await toDependencyTable({
                from: current,
                to: packages,
                ownersChangedDeps,
                format: options.format,
            }));
        }
    }
    else {
        print(options, await toDependencyTable({
            from: current,
            to: upgraded,
            ownersChangedDeps,
            format: options.format,
        }));
    }
}
exports.printUpgradesTable = printUpgradesTable;
/** Prints errors. */
function printErrors(options, errors) {
    if (!errors)
        return;
    if (Object.keys(errors).length > 0) {
        const errorTable = new cli_table_1.default({
            colAligns: ['left', 'right', 'right', 'right', 'left', 'left'],
            chars: {
                top: '',
                'top-mid': '',
                'top-left': '',
                'top-right': '',
                bottom: '',
                'bottom-mid': '',
                'bottom-left': '',
                'bottom-right': '',
                left: '',
                'left-mid': '',
                mid: '',
                'mid-mid': '',
                right: '',
                'right-mid': '',
                middle: '',
            },
            rows: Object.entries(errors).map(([dep, error]) => [dep, chalk_1.default.yellow(error)]),
            // coerce type until rows is added @types/cli-table
            // https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/cli-table/index.d.ts
        });
        print(options, '\n' + errorTable.toString());
    }
}
/**
 * @param args.current -
 * @param args.latest -
 * @param args.upgraded -
 * @param args.total -
 * @param args.ownersChangedDeps -
 */
async function printUpgrades(options, { current, latest, upgraded, total, ownersChangedDeps, errors, }) {
    var _a;
    if (!((_a = options.format) === null || _a === void 0 ? void 0 : _a.includes('group'))) {
        print(options, '');
    }
    const smiley = chalk_1.default.green.bold(':)');
    const numErrors = Object.keys(errors || {}).length;
    const target = typeof options.target === 'string' ? options.target : 'target';
    const numUpgraded = Object.keys(upgraded).length;
    if (numUpgraded === 0 && total === 0 && numErrors === 0) {
        if (Object.keys(current).length === 0) {
            print(options, 'No dependencies.');
        }
        else if (latest &&
            Object.keys(latest).length === 0 &&
            // some specs are ignored by ncu, like the file: protocol, so they should be ignored when detecting fetch issues
            Object.values((0, filterObject_1.default)(current, (name, spec) => isFetchable(spec))).length > 0) {
            print(options, `No package versions were returned. This is likely a problem with your installed ${options.packageManager}, the npm registry, or your Internet connection. Make sure ${chalk_1.default.cyan('npx pacote packument ncu-test-v2')} is working before reporting an issue.`);
        }
        else if (options.global) {
            print(options, `All global packages are up-to-date ${smiley}`);
        }
        else {
            print(options, `All dependencies match the ${target} package versions ${smiley}`);
        }
    }
    else if (numUpgraded === 0 && total > 0) {
        print(options, `No dependencies upgraded ${smiley}`);
    }
    // print table
    else if (numUpgraded > 0) {
        await printUpgradesTable({
            current,
            upgraded,
            ownersChangedDeps,
        }, options);
    }
    printErrors(options, errors);
}
exports.printUpgrades = printUpgrades;
/** Print updates that were ignored due to incompatible peer dependencies. */
function printIgnoredUpdates(options, ignoredUpdates) {
    print(options, `\nIgnored incompatible updates (peer dependencies):\n`);
    const table = renderDependencyTable(Object.entries(ignoredUpdates).map(([pkgName, { from, to, reason }]) => {
        const strReason = 'reason: ' +
            Object.entries(reason)
                .map(([pkgReason, requirement]) => pkgReason + ' requires ' + requirement)
                .join(', ');
        return [pkgName, from, '→', (0, version_util_1.colorizeDiff)(from, to), strReason];
    }));
    print(options, table);
}
exports.printIgnoredUpdates = printIgnoredUpdates;
//# sourceMappingURL=logging.js.map