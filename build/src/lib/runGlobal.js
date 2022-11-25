"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pick_1 = __importDefault(require("lodash/pick"));
const logging_1 = require("../lib/logging");
const chalk_1 = __importDefault(require("./chalk"));
const getInstalledPackages_1 = __importDefault(require("./getInstalledPackages"));
const keyValueBy_1 = require("./keyValueBy");
const upgradePackageDefinitions_1 = __importDefault(require("./upgradePackageDefinitions"));
/** Checks global dependencies for upgrades. */
async function runGlobal(options) {
    (0, logging_1.print)(options, 'Getting installed packages', 'verbose');
    const globalPackages = await (0, getInstalledPackages_1.default)((0, pick_1.default)(options, ['cwd', 'filter', 'filterVersion', 'global', 'packageManager', 'prefix', 'reject', 'rejectVersion']));
    (0, logging_1.print)(options, 'globalPackages:', 'verbose');
    (0, logging_1.print)(options, globalPackages, 'verbose');
    (0, logging_1.print)(options, '', 'verbose');
    (0, logging_1.print)(options, `Fetching ${options.target} versions`, 'verbose');
    const [upgraded, latest] = await (0, upgradePackageDefinitions_1.default)(globalPackages, options);
    (0, logging_1.print)(options, latest, 'verbose');
    const latestVersions = (0, keyValueBy_1.keyValueBy)(latest, (key, value) => (value.version ? { [key]: value.version } : null));
    const upgradedPackageNames = Object.keys(upgraded);
    await (0, logging_1.printUpgrades)(options, {
        current: globalPackages,
        upgraded,
        latest: latestVersions,
        total: upgradedPackageNames.length,
    });
    const instruction = upgraded ? upgradedPackageNames.map(pkg => pkg + '@' + upgraded[pkg]).join(' ') : '[package]';
    if (options.json) {
        // since global packages do not have a package.json, return the upgraded deps directly (no version range replacements)
        (0, logging_1.printJson)(options, upgraded);
    }
    else if (instruction.length) {
        const upgradeCmd = options.packageManager === 'yarn' ? 'yarn global upgrade' : 'npm -g install';
        (0, logging_1.print)(options, '\n' +
            chalk_1.default.cyan('ncu') +
            ' itself cannot upgrade global packages. Run the following to upgrade all global packages: \n\n' +
            chalk_1.default.cyan(`${upgradeCmd} ` + instruction) +
            '\n');
    }
    // if errorLevel is 2, exit with non-zero error code
    if (options.cli && options.errorLevel === 2 && upgradedPackageNames.length > 0) {
        process.exit(1);
    }
    return upgraded;
}
exports.default = runGlobal;
//# sourceMappingURL=runGlobal.js.map