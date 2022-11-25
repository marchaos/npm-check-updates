import { PackageFile } from '../types/PackageFile';
/**
 * @param packageName A package name as listed in package.json's dependencies list
 * @param packageJson Optional param to specify a object representation of a package.json file instead of loading from node_modules
 * @returns A valid url to the root of the package's source or null if a url could not be determined
 */
declare function getRepoUrl(packageName: string, packageJson?: PackageFile): Promise<string | null>;
export default getRepoUrl;
