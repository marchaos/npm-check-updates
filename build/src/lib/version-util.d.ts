import semverutils, { SemVer } from 'semver-utils';
import { Index } from '../types/IndexType';
import { Maybe } from '../types/Maybe';
import { Options } from '../types/Options';
import { UpgradeGroup } from '../types/UpgradeGroup';
import { VersionLevel } from '../types/VersionLevel';
type VersionPart = keyof SemVer;
export declare const DEFAULT_WILDCARD = "^";
export declare const WILDCARDS: string[];
interface UpgradeOptions {
    wildcard?: string;
    removeRange?: boolean;
}
/**
 * @param version
 * @returns The number of parts in the version
 */
export declare function numParts(version: string): number;
/**
 * Increases or decreases the a precision by the given amount, e.g. major+1 -> minor
 *
 * @param precision
 * @param n
 * @returns
 */
export declare function precisionAdd(precision: VersionPart, n: number): keyof semverutils.SemVer;
/**
 * Joins the major, minor, patch, release, and build parts (controlled by an
 * optional precision arg) of a semver object into a dot-delimited string.
 *
 * @param semver
 * @param [precision]
 * @returns
 */
export declare function stringify(semver: SemVer, precision?: VersionPart): string;
/**
 * Gets how precise this version number is (major, minor, patch, release, or build)
 *
 * @param version
 * @returns
 */
export declare function getPrecision(version: string): keyof semverutils.SemVer | undefined;
/**
 * Sets the precision of a (loose) semver to the specified level: major, minor, etc.
 *
 * @param version
 * @param [precision]
 * @returns
 */
export declare function setPrecision(version: string, precision: VersionPart): string;
/**
 * Adds a given wildcard (^,~,.*,.x) to a version number. Adds ^ and ~ to the
 * beginning. Replaces everything after the major version number with .* or .x
 *
 * @param version
 * @param wildcard
 * @returns
 */
export declare function addWildCard(version: string, wildcard: string): string;
/**
 * Returns true if the given string is one of the wild cards.
 *
 * @param version
 * @returns
 */
export declare function isWildCard(version: string): boolean;
/**
 * Returns true if the given digit is a wildcard for a part of a version.
 *
 * @param versionPart
 * @returns
 */
export declare function isWildPart(versionPartValue: Maybe<string>): boolean;
/**
 * Determines the part of a version string that has changed when comparing two versions. Assumes that the two version strings are in the same format. Returns null if no parts have changed.
 *
 * @param from
 * @param to
 */
export declare function partChanged(from: string, to: string): UpgradeGroup;
/**
 * Returns a list of group heading and a map of package names and versions.
 * Used with --format group and takes into account the custom --group function.
 */
export declare function getDependencyGroups(newDependencies: Index<string>, oldDependencies: Index<string>, options: Options): {
    heading: string;
    groupName: string;
    packages: Index<string>;
}[];
/**
 * Colorize the parts of a version string (to) that are different than
 * another (from). Assumes that the two verson strings are in the same format.
 *
 * @param from
 * @param to
 * @returns
 */
export declare function colorizeDiff(from: string, to: string): string;
/**
 * Check if it is allowed to compare two versions based on their prerelease tag
 *
 * SemVer both states that different prerelease versions can`t be compared
 * and at the same time compares them as part of the version via strcmp
 *
 * @param a
 * @param b
 * @returns True if two versions can be compared by the means of SemVer
 */
export declare function isComparable(a: string, b: string): boolean;
/** Comparator used to sort semver versions */
export declare function compareVersions(a: string, b: string): 0 | 1 | -1;
/**
 * Finds the greatest version at the given level (minor|patch).
 *
 * @param versions  Unsorted array of all available versions
 * @param current   Current version or range
 * @param level     major|minor
 * @returns         String representation of the suggested version.
 */
export declare function findGreatestByLevel(versions: string[], current: string, level: VersionLevel): string | null;
/**
 * @param version
 * @returns True if the version is any kind of prerelease: alpha, beta, rc, pre
 */
export declare function isPre(version: string): boolean;
/** Converts a pseudo version into a valid semver version. NOOP for valid semver versions. */
export declare const fixPseudoVersion: (s: string) => string;
/**
 * Returns 'v' if the string starts with a v, otherwise returns empty string.
 *
 * @param str
 * @returns
 */
export declare function v(str: Maybe<string>): "" | "v";
/**
 * Constructs an npm alias from the name and version of the actual package.
 *
 * @param name Name of the actual package.
 * @param version Version of the actual package.
 * @returns    "npm:package@x.y.z"
 * @example    createNpmAlias('chalk', '2.0.0') -> 'npm:chalk@2.0.0'
 */
export declare const createNpmAlias: (name: string, version: string) => string;
/**
 * Parses an npm alias into a [name, version] 2-tuple.
 *
 * @returns  [name, version] or null if the input is not an npm alias
 * @example  'npm:chalk@1.0.0' -> ['chalk', '1.0.0']
 */
export declare const parseNpmAlias: (alias: string) => "" | string[] | null;
/**
 * Returns true if a version declaration is an npm alias.
 */
export declare const isNpmAlias: (declaration: string) => boolean | "";
/**
 * Replaces the version number embedded in an npm alias.
 */
export declare const upgradeNpmAlias: (declaration: string, upgraded: string) => string | null;
/**
 * Returns true if a version declaration is a Github URL with a valid semver version.
 */
export declare const isGithubUrl: (declaration: string | null) => boolean;
/**
 * Returns the embedded tag in a Github URL.
 */
export declare const getGithubUrlTag: (declaration: string | null) => string | null;
/**
 * Upgrade an existing dependency declaration to satisfy the latest version.
 *
 * @param declaration Current version declaration (e.g. "1.2.x")
 * @param latestVersion Latest version (e.g "1.3.2")
 * @param [options={}]
 * @returns The upgraded dependency declaration (e.g. "1.3.x")
 */
export declare function upgradeDependencyDeclaration(declaration: string, latestVersion: string | null, options?: UpgradeOptions): string;
/**
 * Replaces the version number embedded in a Github URL.
 */
export declare const upgradeGithubUrl: (declaration: string, upgraded: string) => string;
export {};
