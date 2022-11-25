import { DoctorResult, PackageUpgradeInfo } from './lib/doctor';
import getNcuRc from './lib/getNcuRc';
import { Index } from './types/IndexType';
import { PackageFile } from './types/PackageFile';
import { RunOptions } from './types/RunOptions';
import { VersionSpec } from './types/VersionSpec';
/** Main entry point.
 *
 * @returns Promise<
 * PackageFile                    Default returns upgraded package file.
 * | Index<VersionSpec>    --jsonUpgraded returns only upgraded dependencies.
 * | void                         --global upgrade returns void.
 * >
 */
export declare function run(runOptions?: RunOptions, { cli }?: {
    cli?: boolean;
}): Promise<PackageFile | Index<VersionSpec> | DoctorResult | void>;
export { getNcuRc };
export type { RunOptions, DoctorResult, PackageUpgradeInfo };
export default run;
