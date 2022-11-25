"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sinon_1 = __importDefault(require("sinon"));
const npmPackageManager = __importStar(require("../../src/package-managers/npm"));
/** Stubs the npmView function from package-managers/npm. Only works with ncu.run in tests, not spawn. Returns the stub object. Call stub.restore() after assertions to restore the original function. */
const stubNpmView = (mockReturnedVersions) => sinon_1.default.stub(npmPackageManager, 'viewManyMemoized').callsFake((name) => {
    const version = typeof mockReturnedVersions === 'string' ? mockReturnedVersions : mockReturnedVersions[name];
    const packument = {
        name,
        engines: { node: '' },
        time: { [version]: new Date().toISOString() },
        version,
        // versions are not needed in nested packument
        versions: [],
    };
    return Promise.resolve({
        ...packument,
        versions: [packument],
    });
});
exports.default = stubNpmView;
//# sourceMappingURL=stubNpmView.js.map