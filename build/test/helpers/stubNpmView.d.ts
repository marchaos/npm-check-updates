import sinon from 'sinon';
import { Index } from '../../src/types/IndexType';
import { Version } from '../../src/types/Version';
/** Stubs the npmView function from package-managers/npm. Only works with ncu.run in tests, not spawn. Returns the stub object. Call stub.restore() after assertions to restore the original function. */
declare const stubNpmView: (mockReturnedVersions: Index<Version> | Version) => sinon.SinonStub<[packageName: string, fields: string[], currentVersion: string, options: import("../../src/types/Options").Options, retried?: number | undefined, npmConfigLocal?: import("../../src/types/NpmConfig").NpmConfig | undefined], Promise<import("../../src/types/Packument").Packument>>;
export default stubNpmView;
