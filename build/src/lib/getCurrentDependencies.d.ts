import { Index } from '../types/IndexType';
import { Options } from '../types/Options';
import { PackageFile } from '../types/PackageFile';
/**
 * Get the current dependencies from the package file.
 *
 * @param [pkgData={}] Object with dependencies, devDependencies, peerDependencies, optionalDependencies, and/or bundleDependencies properties
 * @param [options={}]
 * @param options.dep
 * @param options.filter
 * @param options.reject
 * @returns Promised {packageName: version} collection
 */
declare function getCurrentDependencies(pkgData?: PackageFile, options?: Options): Index<string>;
export default getCurrentDependencies;
