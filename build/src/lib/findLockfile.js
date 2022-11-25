"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
/**
 * Goes up the filesystem tree until it finds a package-lock.json or yarn.lock.
 *
 * @param readdirSync This is only a parameter so that it can be used in tests.
 * @returns The path of the directory that contains the lockfile and the
 * filename of the lockfile.
 */
async function findLockfile(options, readdir = promises_1.default.readdir) {
    try {
        // 1. explicit cwd
        // 2. same directory as package file
        // 3. current directory
        let currentPath = options.cwd ? options.cwd : options.packageFile ? path_1.default.dirname(options.packageFile) : '.';
        // eslint-disable-next-line fp/no-loops
        while (true) {
            const files = await readdir(currentPath);
            if (files.includes('package-lock.json')) {
                return { directoryPath: currentPath, filename: 'package-lock.json' };
            }
            if (files.includes('yarn.lock')) {
                return { directoryPath: currentPath, filename: 'yarn.lock' };
            }
            const pathParent = path_1.default.resolve(currentPath, '..');
            if (pathParent === currentPath)
                break;
            currentPath = pathParent;
        }
    }
    catch (e) {
        // if readdirSync fails, return null
    }
    return null;
}
exports.default = findLockfile;
//# sourceMappingURL=findLockfile.js.map