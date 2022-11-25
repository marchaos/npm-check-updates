"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const flatten_1 = __importDefault(require("lodash/flatten"));
const map_1 = __importDefault(require("lodash/map"));
const path_1 = __importDefault(require("path"));
const rc_config_loader_1 = require("rc-config-loader");
const cli_options_1 = require("../cli-options");
/**
 * Loads the .ncurc config file.
 *
 * @param [cfg]
 * @param [cfg.configFileName=.ncurc]
 * @param [cfg.configFilePath]
 * @param [cfg.packageFile]
 * @returns
 */
async function getNcuRc({ color, configFileName, configFilePath, packageFile } = {}) {
    const { default: chalkDefault, Chalk } = await import('chalk');
    const chalk = color ? new Chalk({ level: 1 }) : chalkDefault;
    const result = (0, rc_config_loader_1.rcFile)('ncurc', {
        configFileName: configFileName || '.ncurc',
        defaultExtension: ['.json', '.yml', '.js'],
        cwd: configFilePath || (packageFile ? path_1.default.dirname(packageFile) : undefined),
    });
    // validate arguments here to provide a better error message
    const unknownOptions = Object.keys((result === null || result === void 0 ? void 0 : result.config) || {}).filter(arg => !cli_options_1.cliOptionsMap[arg]);
    if (unknownOptions.length > 0) {
        console.error(chalk.red(`Unknown option${unknownOptions.length === 1 ? '' : 's'} found in config file:`), chalk.gray(unknownOptions.join(', ')));
        console.info('Using config file ' + result.filePath);
        console.info(`You can change the config file path with ${chalk.blue('--configFilePath')}`);
    }
    // flatten config object into command line arguments to be read by commander
    const args = result
        ? (0, flatten_1.default)((0, map_1.default)(result.config, (value, name) => {
            var _a, _b;
            // if a boolean option is true, include only the nullary option --${name}
            // an option is considered boolean if its type is explicitly set to boolean, or if it is has a proper Javascript boolean value
            return value === true || (((_a = cli_options_1.cliOptionsMap[name]) === null || _a === void 0 ? void 0 : _a.type) === 'boolean' && value)
                ? [`--${name}`]
                : // if a boolean option is false, exclude it
                    value === false || (((_b = cli_options_1.cliOptionsMap[name]) === null || _b === void 0 ? void 0 : _b.type) === 'boolean' && !value)
                        ? []
                        : // otherwise render as a 2-tuple
                            [`--${name}`, value];
        }))
        : [];
    return result ? { ...result, args } : null;
}
exports.default = getNcuRc;
//# sourceMappingURL=getNcuRc.js.map