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
const chai_1 = __importDefault(require("chai"));
const ncu = __importStar(require("../src/"));
chai_1.default.should();
process.env.NCU_TESTS = 'true';
describe('enginesNode', () => {
    it('enable --enginesNode matching ', async () => {
        const upgradedPkg = await ncu.run({
            jsonAll: true,
            packageData: {
                dependencies: {
                    del: '3.0.0',
                },
                engines: {
                    node: '>=6',
                },
            },
            enginesNode: true,
        });
        upgradedPkg.should.eql({
            dependencies: {
                del: '4.1.1',
            },
            engines: {
                node: '>=6',
            },
        });
    });
    it('enable engines matching if --enginesNode', async () => {
        const upgradedPkg = await ncu.run({
            jsonAll: true,
            packageData: {
                dependencies: {
                    del: '3.0.0',
                },
                engines: {
                    node: '>=6',
                },
            },
            enginesNode: true,
        });
        upgradedPkg.should.have.property('dependencies');
        const deps = upgradedPkg.dependencies;
        deps.should.have.property('del');
        deps.del.should.equal('4.1.1');
    });
    it('enable engines matching if --enginesNode, not update if matches not exists', async () => {
        const upgradedPkg = await ncu.run({
            jsonAll: true,
            packageData: {
                dependencies: {
                    del: '3.0.0',
                },
                engines: {
                    node: '>=1',
                },
            },
            enginesNode: true,
        });
        upgradedPkg.should.have.property('dependencies');
        const deps = upgradedPkg.dependencies;
        deps.should.have.property('del');
        deps.del.should.equal('3.0.0');
    });
    it('enable engines matching if --enginesNode, update to latest version if engines.node not exists', async () => {
        const upgradedPkg = await ncu.run({
            jsonAll: true,
            packageData: {
                dependencies: {
                    del: '3.0.0',
                },
            },
            enginesNode: true,
        });
        upgradedPkg.should.have.property('dependencies');
        const deps = upgradedPkg.dependencies;
        deps.should.have.property('del');
        deps.del.should.not.equal('3.0.0');
        deps.del.should.not.equal('4.1.1');
    });
});
//# sourceMappingURL=enginesNode.test.js.map