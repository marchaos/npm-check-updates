"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOwnerPerDependency = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const json_parse_helpfulerror_1 = __importDefault(require("json-parse-helpfulerror"));
const get_1 = __importDefault(require("lodash/get"));
const isEmpty_1 = __importDefault(require("lodash/isEmpty"));
const pick_1 = __importDefault(require("lodash/pick"));
const transform_1 = __importDefault(require("lodash/transform"));
const prompts_ncu_1 = __importDefault(require("prompts-ncu"));
const semver_1 = require("semver");
const chalk_1 = __importDefault(require("./chalk"));
const getCurrentDependencies_1 = __importDefault(require("./getCurrentDependencies"));
const getIgnoredUpgrades_1 = __importDefault(require("./getIgnoredUpgrades"));
const getPackageFileName_1 = __importDefault(require("./getPackageFileName"));
const getPackageManager_1 = __importDefault(require("./getPackageManager"));
const getPeerDependencies_1 = __importDefault(require("./getPeerDependencies"));
const keyValueBy_1 = __importDefault(require("./keyValueBy"));
const logging_1 = require("./logging");
const programError_1 = __importDefault(require("./programError"));
const upgradePackageData_1 = __importDefault(require("./upgradePackageData"));
const upgradePackageDefinitions_1 = __importDefault(require("./upgradePackageDefinitions"));
const version_util_1 = require("./version-util");
const INTERACTIVE_HINT = `
  ↑/↓: Select a package
  Space: Toggle selection
  a: Toggle all
  Enter: Upgrade`;
/** Recreate the options object sorted. */
function sortOptions(options) {
    return (0, transform_1.default)(Object.keys(options).sort(), // eslint-disable-line fp/no-mutating-methods
    (accum, key) => {
        accum[key] = options[key];
    }, {});
}
/**
 * Return a promise which resolves to object storing package owner changed status for each dependency.
 *
 * @param fromVersion current packages version.
 * @param toVersion target packages version.
 * @param options
 * @returns
 */
async function getOwnerPerDependency(fromVersion, toVersion, options) {
    const packageManager = (0, getPackageManager_1.default)(options.packageManager);
    return await Object.keys(toVersion).reduce(async (accum, dep) => {
        const from = fromVersion[dep] || null;
        const to = toVersion[dep] || null;
        const ownerChanged = await packageManager.packageAuthorChanged(dep, from, to, options);
        return {
            ...(await accum),
            [dep]: ownerChanged,
        };
    }, {});
}
exports.getOwnerPerDependency = getOwnerPerDependency;
/** Prompts the user to choose which upgrades to upgrade. */
const chooseUpgrades = async (oldDependencies, newDependencies, options) => {
    var _a;
    let chosenDeps = [];
    // use toDependencyTable to create choices that are properly padded to align vertically
    const table = await (0, logging_1.toDependencyTable)({
        from: oldDependencies,
        to: newDependencies,
        format: options.format,
    });
    const formattedLines = (0, keyValueBy_1.default)(table.toString().split('\n'), line => {
        const dep = line.trim().split(' ')[0];
        return {
            [dep]: line.trim(),
        };
    });
    // do not prompt if there are no dependencies
    // prompts will crash if passed an empty list of choices
    if (Object.keys(newDependencies).length > 0) {
        (0, logging_1.print)(options, '');
        if ((_a = options.format) === null || _a === void 0 ? void 0 : _a.includes('group')) {
            const groups = (0, version_util_1.getDependencyGroups)(newDependencies, oldDependencies, options);
            const choices = groups.flatMap(({ heading, groupName, packages }) => {
                return [
                    { title: '\n' + heading, heading: true },
                    // eslint-disable-next-line fp/no-mutating-methods
                    ...Object.keys(packages)
                        .sort()
                        .map(dep => ({
                        title: formattedLines[dep],
                        value: dep,
                        selected: ['patch', 'minor'].includes(groupName),
                    })),
                ];
            });
            const response = await (0, prompts_ncu_1.default)({
                choices: [...choices, { title: ' ', heading: true }],
                hint: INTERACTIVE_HINT,
                instructions: false,
                message: 'Choose which packages to update',
                name: 'value',
                optionsPerPage: 50,
                type: 'multiselect',
                onState: (state) => {
                    if (state.aborted) {
                        process.nextTick(() => process.exit(1));
                    }
                },
            });
            chosenDeps = response.value;
        }
        else {
            // eslint-disable-next-line fp/no-mutating-methods
            const choices = Object.keys(newDependencies)
                .sort()
                .map(dep => ({
                title: formattedLines[dep],
                value: dep,
                selected: true,
            }));
            const response = await (0, prompts_ncu_1.default)({
                choices: [...choices, { title: ' ', heading: true }],
                hint: INTERACTIVE_HINT + '\n',
                instructions: false,
                message: 'Choose which packages to update',
                name: 'value',
                optionsPerPage: 50,
                type: 'multiselect',
                onState: (state) => {
                    if (state.aborted) {
                        process.nextTick(() => process.exit(1));
                    }
                },
            });
            chosenDeps = response.value;
        }
    }
    return (0, keyValueBy_1.default)(chosenDeps, dep => ({ [dep]: newDependencies[dep] }));
};
/** Checks local project dependencies for upgrades. */
async function runLocal(options, pkgData, pkgFile) {
    (0, logging_1.print)(options, '\nOptions:', 'verbose');
    (0, logging_1.print)(options, sortOptions(options), 'verbose');
    let pkg;
    try {
        if (!pkgData) {
            throw new Error('Missing pkgData: ' + pkgData);
        }
        else {
            pkg = json_parse_helpfulerror_1.default.parse(pkgData);
        }
    }
    catch (e) {
        (0, programError_1.default)(options, await chalk_1.default.red(`Invalid package file${pkgFile ? `: ${pkgFile}` : ' from stdin'}. Error details:\n${e.message}`));
    }
    const current = (0, getCurrentDependencies_1.default)(pkg, options);
    (0, logging_1.print)(options, '\nCurrent versions:', 'verbose');
    (0, logging_1.print)(options, current, 'verbose');
    if (options.enginesNode) {
        options.nodeEngineVersion = (0, get_1.default)(pkg, 'engines.node');
    }
    if (options.peer) {
        options.peerDependencies = await (0, getPeerDependencies_1.default)(current, options);
    }
    const [upgraded, latestResults, upgradedPeerDependencies] = await (0, upgradePackageDefinitions_1.default)(current, options);
    const latest = (0, keyValueBy_1.default)(latestResults, (key, result) => (result.version ? { [key]: result.version } : null));
    const errors = (0, keyValueBy_1.default)(latestResults, (key, result) => (result.error ? { [key]: result.error } : null));
    if (options.peer) {
        (0, logging_1.print)(options, '\nupgradedPeerDependencies:', 'verbose');
        (0, logging_1.print)(options, upgradedPeerDependencies, 'verbose');
    }
    (0, logging_1.print)(options, `\n${typeof options.target === 'string' ? `${options.target[0].toUpperCase()}${options.target.slice(1)}` : 'Fetched'} versions:`, 'verbose');
    (0, logging_1.print)(options, latest, 'verbose');
    (0, logging_1.print)(options, '\nUpgraded versions:', 'verbose');
    (0, logging_1.print)(options, upgraded, 'verbose');
    // filter out satisfied deps when using --minimal
    const filteredUpgraded = options.minimal
        ? (0, keyValueBy_1.default)(upgraded, (dep, version) => (!(0, semver_1.satisfies)(latest[dep], current[dep]) ? { [dep]: version } : null))
        : upgraded;
    const ownersChangedDeps = (options.format || []).includes('ownerChanged')
        ? await getOwnerPerDependency(current, filteredUpgraded, options)
        : undefined;
    const chosenUpgraded = options.interactive
        ? await chooseUpgrades(current, filteredUpgraded, options)
        : filteredUpgraded;
    if (!options.json || options.deep) {
        await (0, logging_1.printUpgrades)(
        // in interactive mode, do not group upgrades afterwards since the prompts are grouped
        options.interactive
            ? { ...options, format: (options.format || []).filter(formatType => formatType !== 'group') }
            : options, {
            current,
            upgraded: chosenUpgraded,
            total: Object.keys(upgraded).length,
            latest,
            ownersChangedDeps,
            errors,
        });
        if (options.peer) {
            const ignoredUpdates = await (0, getIgnoredUpgrades_1.default)(current, upgraded, upgradedPeerDependencies, options);
            if (!(0, isEmpty_1.default)(ignoredUpdates)) {
                (0, logging_1.printIgnoredUpdates)(options, ignoredUpdates);
            }
        }
    }
    const newPkgData = await (0, upgradePackageData_1.default)(pkgData, current, chosenUpgraded);
    const output = options.jsonAll
        ? json_parse_helpfulerror_1.default.parse(newPkgData)
        : options.jsonDeps
            ? (0, pick_1.default)(json_parse_helpfulerror_1.default.parse(newPkgData), 'dependencies', 'devDependencies', 'optionalDependencies')
            : chosenUpgraded;
    // will be overwritten with the result of fs.writeFile so that the return promise waits for the package file to be written
    let writePromise = Promise.resolve();
    if (options.json && !options.deep) {
        (0, logging_1.printJson)(options, output);
    }
    if (Object.keys(filteredUpgraded).length > 0) {
        // if there is a package file, write the new package data
        // otherwise, suggest ncu -u
        if (pkgFile) {
            if (options.upgrade) {
                // do not await until the end
                writePromise = promises_1.default.writeFile(pkgFile, newPkgData);
            }
            else {
                const ncuCmd = process.env.npm_lifecycle_event === 'npx' ? 'npx npm-check-updates' : 'ncu';
                const argv = process.argv.slice(2).join(' ');
                const ncuOptions = argv ? ' ' + argv : argv;
                (0, logging_1.print)(options, `\nRun ${chalk_1.default.cyan(`${ncuCmd}${ncuOptions} -u`)} to upgrade ${(0, getPackageFileName_1.default)(options)}`);
            }
        }
        // if errorLevel is 2, exit with non-zero error code
        if (options.errorLevel === 2) {
            writePromise.then(() => {
                (0, programError_1.default)(options, '\nDependencies not up-to-date');
            });
        }
    }
    await writePromise;
    return output;
}
exports.default = runLocal;
//# sourceMappingURL=runLocal.js.map