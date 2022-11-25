/// <reference types="lodash" />
import { GetVersion } from '../types/GetVersion';
import { Index } from '../types/IndexType';
import { NpmOptions } from '../types/NpmOptions';
import { Options } from '../types/Options';
import { SpawnOptions } from '../types/SpawnOptions';
export interface NpmScope {
    npmAlwaysAuth?: boolean;
    npmAuthToken?: string;
    npmRegistryServer?: string;
}
/** Reads an auth token from a yarn config, interpolates it, and returns it as an npm config key-value pair. */
export declare const npmAuthTokenKeyValue: import("lodash").CurriedFunction3<Index<string | boolean>, string, NpmScope, {
    [x: string]: string;
} | null>;
/**
 * Returns the path to the local .yarnrc.yml, or undefined. This doesn't
 * actually check that the .yarnrc.yml file exists.
 *
 * Exported for test purposes only.
 *
 * @param readdirSync This is only a parameter so that it can be used in tests.
 */
export declare function getPathToLookForYarnrc(options: Options, readdir?: (_path: string) => Promise<string[]>): Promise<string | undefined>;
/**
 * Spawn yarn requires a different command on Windows.
 *
 * @param args
 * @param [yarnOptions={}]
 * @param [spawnOptions={}]
 * @returns
 */
declare function spawnYarn(args: string | string[], yarnOptions?: NpmOptions, spawnOptions?: SpawnOptions): Promise<string>;
/**
 * Get platform-specific default prefix to pass on to yarn.
 *
 * @param options
 * @param [options.global]
 * @param [options.prefix]
 * @returns
 */
export declare function defaultPrefix(options: Options): Promise<any>;
/**
 * Fetches the list of all installed packages.
 *
 * @param [options]
 * @param [options.cwd]
 * @param [options.global]
 * @param [options.prefix]
 * @returns
 */
export declare const list: (options?: Options, spawnOptions?: SpawnOptions) => Promise<Index<string | undefined>>;
/**
 * Fetches the highest version number, regardless of tag or publish time.
 *
 * @param packageName
 * @param currentVersion
 * @param options
 * @returns
 */
export declare const greatest: GetVersion;
/**
 * @param packageName
 * @param currentVersion
 * @param options
 * @returns
 */
export declare const distTag: GetVersion;
/**
 * Fetches the version published to the latest tag.
 *
 * @param packageName
 * @param currentVersion
 * @param options
 * @returns
 */
export declare const latest: GetVersion;
/**
 * Fetches the most recently published version, regardless of version number.
 *
 * @param packageName
 * @param currentVersion
 * @param options
 * @returns
 */
export declare const newest: GetVersion;
/**
 * Fetches the highest version with the same major version as currentVersion.
 *
 * @param packageName
 * @param currentVersion
 * @param options
 * @returns
 */
export declare const minor: GetVersion;
/**
 * Fetches the highest version with the same minor and major version as currentVersion.
 *
 * @param packageName
 * @param currentVersion
 * @param options
 * @returns
 */
export declare const patch: GetVersion;
export default spawnYarn;