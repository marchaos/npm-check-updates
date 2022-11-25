import { Options } from '../types/Options';
/**
 * Goes up the filesystem tree until it finds a package-lock.json or yarn.lock.
 *
 * @param readdirSync This is only a parameter so that it can be used in tests.
 * @returns The path of the directory that contains the lockfile and the
 * filename of the lockfile.
 */
export default function findLockfile(options: Pick<Options, 'cwd' | 'packageFile'>, readdir?: (_path: string) => Promise<string[]>): Promise<{
    directoryPath: string;
    filename: string;
} | null>;