"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chalkInit = void 0;
/*

This chalk wrapper allows synchronous chalk.COLOR(...) syntax with special support for:

1) dynamic import as pure ESM module
2) force color on all instances

Call await chalkInit(color) at the beginning of execution and the chalk instance will be available everywhere.

It is a hacky solution, but it is the easiest way to import and pass the color option to all chalk instances without brutalizing the syntax.

*/
const keyValueBy_1 = __importDefault(require("./keyValueBy"));
const chalkMethods = {
    blue: true,
    bold: true,
    cyan: true,
    gray: true,
    green: true,
    magenta: true,
    red: true,
    yellow: true,
};
// a Promise of a chalk instance that can optionally force color
let chalkInstance;
/** Initializes the global chalk instance with an optional flag for forced color. Idempotent. */
const chalkInit = async (color) => {
    const chalkModule = await import('chalk');
    const { default: chalkDefault, Chalk } = chalkModule;
    chalkInstance = color ? new Chalk({ level: 1 }) : chalkDefault;
};
exports.chalkInit = chalkInit;
/** Asserts that chalk has been imported. */
const assertChalk = () => {
    if (!chalkInstance) {
        throw new Error(`Chalk has not been imported yet. Chalk is a dynamic import and requires that you await { chalkInit } from './lib/chalk'.`);
    }
};
// generate an async method for each chalk method that calls a chalk instance with global.color for forced color
const chalkGlobal = (0, keyValueBy_1.default)(chalkMethods, name => {
    /** Chained bold method. */
    const bold = (s) => {
        assertChalk();
        return chalkInstance[name].bold(s);
    };
    /** Chalk method. */
    const method = (s) => {
        assertChalk();
        return chalkInstance[name](s);
    };
    method.bold = bold;
    return {
        [name]: method,
    };
});
exports.default = chalkGlobal;
//# sourceMappingURL=chalk.js.map