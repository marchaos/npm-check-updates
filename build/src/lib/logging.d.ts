import { IgnoredUpgrade } from '../types/IgnoredUpgrade';
import { Index } from '../types/IndexType';
import { Options } from '../types/Options';
import { Version } from '../types/Version';
import { VersionSpec } from '../types/VersionSpec';
/**
 * Prints a message if it is included within options.loglevel.
 *
 * @param options    Command line options. These will be compared to the loglevel parameter to determine if the message gets printed.
 * @param message    The message to print
 * @param loglevel   silent|error|warn|info|verbose|silly
 * @param method     The console method to call. Default: 'log'.
 */
export declare function print(options: Options, message: any, loglevel?: 'silent' | 'error' | 'warn' | 'info' | 'verbose' | 'silly' | null, method?: 'log' | 'warn' | 'info' | 'error'): void;
/** Pretty print a JSON object. */
export declare function printJson(options: Options, object: any): void;
/**
 * Renders a color-coded table of upgrades.
 *
 * @param args
 * @param args.from
 * @param args.to
 * @param args.ownersChangedDeps
 * @param args.format
 */
export declare function toDependencyTable({ from: fromDeps, to: toDeps, ownersChangedDeps, format, }: {
    from: Index<VersionSpec>;
    to: Index<VersionSpec>;
    ownersChangedDeps?: Index<boolean>;
    format?: string[];
}): Promise<string>;
/**
 * Renders one or more color-coded tables with all upgrades. Supports different formats from the --format option.
 *
 * @param args
 * @param args.current
 * @param args.upgraded
 * @param args.ownersChangedDeps
 * @param options
 */
export declare function printUpgradesTable({ current, upgraded, ownersChangedDeps, }: {
    current: Index<VersionSpec>;
    upgraded: Index<VersionSpec>;
    ownersChangedDeps?: Index<boolean>;
}, options: Options): Promise<void>;
/**
 * @param args.current -
 * @param args.latest -
 * @param args.upgraded -
 * @param args.total -
 * @param args.ownersChangedDeps -
 */
export declare function printUpgrades(options: Options, { current, latest, upgraded, total, ownersChangedDeps, errors, }: {
    current: Index<VersionSpec>;
    latest?: Index<Version>;
    upgraded: Index<VersionSpec>;
    total: number;
    ownersChangedDeps?: Index<boolean>;
    errors?: Index<string>;
}): Promise<void>;
/** Print updates that were ignored due to incompatible peer dependencies. */
export declare function printIgnoredUpdates(options: Options, ignoredUpdates: Index<IgnoredUpgrade>): void;
