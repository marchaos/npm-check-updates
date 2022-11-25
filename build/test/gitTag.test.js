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
const ncu = __importStar(require("../src"));
chai_1.default.should();
process.env.NCU_TESTS = 'true';
describe('github urls', () => {
    it('upgrade github https urls', async () => {
        const upgrades = await ncu.run({
            packageData: {
                dependencies: {
                    'ncu-test-v2': 'https://github.com/raineorshine/ncu-test-v2#1.0.0',
                },
            },
        });
        upgrades.should.deep.equal({
            'ncu-test-v2': 'https://github.com/raineorshine/ncu-test-v2#2.0.0',
        });
    });
    it('upgrade short github urls', async () => {
        const upgrades = await ncu.run({
            packageData: {
                dependencies: {
                    'ncu-test-v2': 'github:raineorshine/ncu-test-v2#1.0.0',
                },
            },
        });
        upgrades.should.deep.equal({
            'ncu-test-v2': 'github:raineorshine/ncu-test-v2#2.0.0',
        });
    });
    it('upgrade shortest github urls', async () => {
        const upgrades = await ncu.run({
            packageData: {
                dependencies: {
                    'ncu-test-v2': 'raineorshine/ncu-test-v2#1.0.0',
                },
            },
        });
        upgrades.should.deep.equal({
            'ncu-test-v2': 'raineorshine/ncu-test-v2#2.0.0',
        });
    });
    it('upgrade github http urls with semver', async () => {
        const upgrades = await ncu.run({
            packageData: {
                dependencies: {
                    'ncu-test-v2': 'https://github.com/raineorshine/ncu-test-v2#semver:^1.0.0',
                },
            },
        });
        upgrades.should.deep.equal({
            'ncu-test-v2': 'https://github.com/raineorshine/ncu-test-v2#semver:^2.0.0',
        });
    });
    // does not work in GitHub actions for some reason
    it.skip('upgrade github git+ssh urls with semver', async () => {
        const upgrades = await ncu.run({
            packageData: {
                dependencies: {
                    'ncu-test-v2': 'git+ssh://git@github.com/raineorshine/ncu-test-v2.git#semver:^1.0.0',
                },
            },
        });
        upgrades.should.deep.equal({
            'ncu-test-v2': 'git+ssh://git@github.com/raineorshine/ncu-test-v2.git#semver:^2.0.0',
        });
    });
});
//# sourceMappingURL=gitTag.test.js.map