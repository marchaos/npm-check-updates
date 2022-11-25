import { GetVersion } from '../types/GetVersion';
import { Index } from '../types/IndexType';
import { NpmConfig } from '../types/NpmConfig';
import { NpmOptions } from '../types/NpmOptions';
import { Options } from '../types/Options';
import { Packument } from '../types/Packument';
import { Version } from '../types/Version';
import { VersionSpec } from '../types/VersionSpec';
/**
 * Check if package author changed between current and upgraded version.
 *
 * @param packageName Name of the package
 * @param currentVersion Current version declaration (may be range)
 * @param upgradedVersion Upgraded version declaration (may be range)
 * @param npmConfigLocal Additional npm config variables that are merged into the system npm config
 * @returns A promise that fullfills with boolean value.
 */
export declare function packageAuthorChanged(packageName: string, currentVersion: VersionSpec, upgradedVersion: VersionSpec, options?: Options, npmConfigLocal?: NpmConfig): Promise<boolean>;
/**
 * Returns an object of specified values retrieved by npm view.
 *
 * @param packageName   Name of the package
 * @param fields        Array of fields like versions, time, version
 * @param               currentVersion
 * @returns             Promised result
 */
export declare function viewMany(packageName: string, fields: string[], currentVersion: Version, options: Options, retried?: number, npmConfigLocal?: NpmConfig): Promise<Packument>;
/** Memoize viewMany for --deep performance. */
export declare const viewManyMemoized: typeof viewMany;
/**
 * Returns the value of one of the properties retrieved by npm view.
 *
 * @param packageName   Name of the package
 * @param field         Field such as "versions" or "dist-tags.latest" are parsed from the pacote result (https://www.npmjs.com/package/pacote#packument)
 * @param currentVersion
 * @returns            Promised result
 */
export declare function viewOne(packageName: string, field: string, currentVersion: Version, options: Options, npmConfigLocal?: NpmConfig): Promise<string | boolean | Index<string> | {
    node: string;
} | Packument[] | undefined>;
/**
 * Spawns npm. Handles different commands for Window and Linux/OSX, and automatically converts --location=global to --global on node < 8.11.0.
 *
 * @param args
 * @param [npmOptions={}]
 * @param [spawnOptions={}]
 * @returns
 */
declare function spawnNpm(args: string | string[], npmOptions?: NpmOptions, spawnOptions?: Index<any>): Promise<any>;
/**
 * Get platform-specific default prefix to pass on to npm.
 *
 * @param options
 * @param [options.global]
 * @param [options.prefix]
 * @returns
 */
export declare function defaultPrefix(options: Options): Promise<string | undefined>;
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
 * Fetches the list of peer dependencies for a specific package version.
 *
 * @param packageName
 * @param version
 * @returns Promised {packageName: version} collection
 */
export declare const getPeerDependencies: (packageName: string, version: Version) => Promise<Index<Version>>;
/**
 * Fetches the list of all installed packages.
 *
 * @param [options]
 * @param [options.cwd]
 * @param [options.global]
 * @param [options.prefix]
 * @returns
 */
export declare const list: (options?: Options) => Promise<Index<any>>;
/**
 * Fetches the version of a package published to options.distTag.
 *
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
export default spawnNpm;