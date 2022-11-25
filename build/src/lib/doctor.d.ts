import { Index } from '../types/IndexType';
import { Options } from '../types/Options';
import { PackageFile } from '../types/PackageFile';
import { VersionSpec } from '../types/VersionSpec';
export interface PackageUpgradeInfo {
    oldVersion: string;
    newVersion: string;
}
export interface DoctorResult {
    upgrades: Record<string, PackageUpgradeInfo>;
    failedUpgrades: Record<string, PackageUpgradeInfo>;
}
type Run = (options?: Options) => Promise<PackageFile | Index<VersionSpec> | DoctorResult | void>;
/** Iteratively installs upgrades and runs tests to identify breaking upgrades. */
declare const doctor: (run: Run, options: Options) => Promise<DoctorResult>;
export default doctor;
