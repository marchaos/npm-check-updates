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
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
const chai_string_1 = __importDefault(require("chai-string"));
const promises_1 = __importDefault(require("fs/promises"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const ncu = __importStar(require("../src/"));
const stubNpmView_1 = __importDefault(require("./helpers/stubNpmView"));
chai_1.default.should();
chai_1.default.use(chai_as_promised_1.default);
chai_1.default.use(chai_string_1.default);
process.env.NCU_TESTS = 'true';
describe('run', function () {
    it('return jsonUpgraded by default', async () => {
        const stub = (0, stubNpmView_1.default)('99.9.9');
        const output = await ncu.run({
            packageData: await promises_1.default.readFile(path_1.default.join(__dirname, 'ncu/package.json'), 'utf-8'),
        });
        output.should.deep.equal({
            express: '^99.9.9',
        });
        stub.restore();
    });
    it('pass object as packageData', async () => {
        const stub = (0, stubNpmView_1.default)('99.9.9');
        const output = await ncu.run({
            packageData: {
                dependencies: {
                    MOCK_PACKAGE: '1.0.0',
                },
            },
        });
        output.should.have.property('MOCK_PACKAGE');
        stub.restore();
    });
    it('do not suggest upgrades to versions within the specified version range if jsonUpgraded is true and minimial is true', async () => {
        const stub = (0, stubNpmView_1.default)('2.1.1');
        const upgraded = await ncu.run({
            packageData: { dependencies: { MOCK_PACKAGE: '^2.1.0' } },
            jsonUpgraded: true,
            minimal: true,
        });
        upgraded.should.not.have.property('MOCK_PACKAGE');
        stub.restore();
    });
    it('do not upgrade peerDependencies by default', async () => {
        const stub = (0, stubNpmView_1.default)('99.9.9');
        const upgraded = await ncu.run({
            packageData: await promises_1.default.readFile(path_1.default.join(__dirname, '/ncu/package-dep.json'), 'utf-8'),
        });
        upgraded.should.have.property('express');
        upgraded.should.have.property('chalk');
        upgraded.should.not.have.property('mocha');
        stub.restore();
    });
    it('only upgrade devDependencies with --dep dev', async () => {
        const stub = (0, stubNpmView_1.default)('99.9.9');
        const upgraded = await ncu.run({
            packageData: await promises_1.default.readFile(path_1.default.join(__dirname, 'ncu/package-dep.json'), 'utf-8'),
            dep: 'dev',
        });
        upgraded.should.not.have.property('express');
        upgraded.should.have.property('chalk');
        upgraded.should.not.have.property('mocha');
        stub.restore();
    });
    it('only upgrade devDependencies and peerDependencies with --dep dev,peer', async () => {
        const upgraded = await ncu.run({
            packageData: await promises_1.default.readFile(path_1.default.join(__dirname, 'ncu/package-dep.json'), 'utf-8'),
            dep: 'dev,peer',
        });
        upgraded.should.not.have.property('express');
        upgraded.should.have.property('chalk');
        upgraded.should.have.property('mocha');
    });
    it('write to --packageFile and output jsonUpgraded', async () => {
        const tempDir = await promises_1.default.mkdtemp(path_1.default.join(os_1.default.tmpdir(), 'npm-check-updates-'));
        const pkgFile = path_1.default.join(tempDir, 'package.json');
        await promises_1.default.writeFile(pkgFile, '{ "dependencies": { "express": "1" } }', 'utf-8');
        try {
            const result = await ncu.run({
                packageFile: pkgFile,
                jsonUpgraded: true,
                upgrade: true,
            });
            result.should.have.property('express');
            const upgradedPkg = JSON.parse(await promises_1.default.readFile(pkgFile, 'utf-8'));
            upgradedPkg.should.have.property('dependencies');
            upgradedPkg.dependencies.should.have.property('express');
        }
        finally {
            await promises_1.default.rm(tempDir, { recursive: true, force: true });
        }
    });
    it('exclude -alpha, -beta, -rc', () => {
        return ncu
            .run({
            jsonAll: true,
            packageData: {
                dependencies: {
                    'ncu-mock-pre': '1.0.0',
                },
            },
        })
            .then(data => {
            return data.should.eql({
                dependencies: {
                    'ncu-mock-pre': '1.0.0',
                },
            });
        });
    });
    it('upgrade prereleases to newer prereleases', () => {
        return ncu
            .run({
            packageData: {
                dependencies: {
                    'ncu-test-alpha-latest': '1.0.0-alpha.1',
                },
            },
        })
            .then(data => {
            return data.should.eql({
                'ncu-test-alpha-latest': '1.0.0-alpha.2',
            });
        });
    });
    it('do not upgrade prereleases to newer prereleases with --pre 0', () => {
        return ncu
            .run({
            pre: false,
            packageData: {
                dependencies: {
                    'ncu-test-alpha-latest': '1.0.0-alpha.1',
                },
            },
        })
            .then(data => {
            return data.should.eql({});
        });
    });
    it('include -alpha, -beta, -rc with --pre option', () => {
        return ncu
            .run({
            jsonAll: true,
            packageData: {
                dependencies: {
                    'ncu-mock-pre': '1.0.0',
                },
            },
            pre: true,
        })
            .then(data => {
            return data.should.eql({
                dependencies: {
                    'ncu-mock-pre': '2.0.0-alpha.0',
                },
            });
        });
    });
    describe('deprecated', () => {
        it('deprecated excluded by default', async () => {
            const upgrades = await ncu.run({
                packageData: {
                    dependencies: {
                        'ncu-test-deprecated': '1.0.0',
                    },
                },
            });
            upgrades.should.deep.equal({});
        });
        it('deprecated included with option', async () => {
            const upgrades = await ncu.run({
                deprecated: true,
                packageData: {
                    dependencies: {
                        'ncu-test-deprecated': '1.0.0',
                    },
                },
            });
            upgrades.should.deep.equal({
                'ncu-test-deprecated': '2.0.0',
            });
        });
    });
    describe('filterVersion', () => {
        it('filter by package version with string', async () => {
            const pkg = {
                dependencies: {
                    'ncu-test-v2': '1.0.0',
                    'ncu-test-return-version': '1.0.1',
                },
            };
            const upgraded = await ncu.run({
                packageData: pkg,
                filterVersion: '1.0.0',
            });
            upgraded.should.have.property('ncu-test-v2');
            upgraded.should.not.have.property('ncu-test-return-version');
        });
        it('filter by package version with space-delimited list of strings', async () => {
            const pkg = {
                dependencies: {
                    'ncu-test-v2': '1.0.0',
                    'ncu-test-return-version': '1.0.1',
                    'fp-and-or': '0.1.0',
                },
            };
            const upgraded = await ncu.run({
                packageData: pkg,
                filterVersion: '1.0.0 0.1.0',
            });
            upgraded.should.have.property('ncu-test-v2');
            upgraded.should.not.have.property('ncu-test-return-version');
            upgraded.should.have.property('fp-and-or');
        });
        it('filter by package version with comma-delimited list of strings', async () => {
            const pkg = {
                dependencies: {
                    'ncu-test-v2': '1.0.0',
                    'ncu-test-return-version': '1.0.1',
                    'fp-and-or': '0.1.0',
                },
            };
            const upgraded = await ncu.run({
                packageData: pkg,
                filterVersion: '1.0.0,0.1.0',
            });
            upgraded.should.have.property('ncu-test-v2');
            upgraded.should.not.have.property('ncu-test-return-version');
            upgraded.should.have.property('fp-and-or');
        });
        it('filter by package version with RegExp', async () => {
            const pkg = {
                dependencies: {
                    'ncu-test-v2': '1.0.0',
                    'ncu-test-return-version': '1.0.1',
                    'fp-and-or': '0.1.0',
                },
            };
            const upgraded = await ncu.run({
                packageData: pkg,
                filterVersion: /^1/,
            });
            upgraded.should.have.property('ncu-test-v2');
            upgraded.should.have.property('ncu-test-return-version');
            upgraded.should.not.have.property('fp-and-or');
        });
        it('filter by package version with RegExp string', async () => {
            const pkg = {
                dependencies: {
                    'ncu-test-v2': '1.0.0',
                    'ncu-test-return-version': '1.0.1',
                    'fp-and-or': '0.1.0',
                },
            };
            const upgraded = await ncu.run({
                packageData: pkg,
                filterVersion: '/^1/',
            });
            upgraded.should.have.property('ncu-test-v2');
            upgraded.should.have.property('ncu-test-return-version');
            upgraded.should.not.have.property('fp-and-or');
        });
    });
    describe('rejectVersion', () => {
        it('reject by package version with string', async () => {
            const pkg = {
                dependencies: {
                    'ncu-test-v2': '1.0.0',
                    'ncu-test-return-version': '1.0.1',
                },
            };
            const upgraded = await ncu.run({
                packageData: pkg,
                rejectVersion: '1.0.0',
            });
            upgraded.should.not.have.property('ncu-test-v2');
            upgraded.should.have.property('ncu-test-return-version');
        });
        it('reject by package version with space-delimited list of strings', async () => {
            const pkg = {
                dependencies: {
                    'ncu-test-v2': '1.0.0',
                    'ncu-test-return-version': '1.0.1',
                    'fp-and-or': '0.1.0',
                },
            };
            const upgraded = await ncu.run({
                packageData: pkg,
                rejectVersion: '1.0.0 0.1.0',
            });
            upgraded.should.not.have.property('ncu-test-v2');
            upgraded.should.have.property('ncu-test-return-version');
            upgraded.should.not.have.property('fp-and-or');
        });
        it('reject by package version with comma-delimited list of strings', async () => {
            const pkg = {
                dependencies: {
                    'ncu-test-v2': '1.0.0',
                    'ncu-test-return-version': '1.0.1',
                    'fp-and-or': '0.1.0',
                },
            };
            const upgraded = await ncu.run({
                packageData: pkg,
                rejectVersion: '1.0.0,0.1.0',
            });
            upgraded.should.not.have.property('ncu-test-v2');
            upgraded.should.have.property('ncu-test-return-version');
            upgraded.should.not.have.property('fp-and-or');
        });
        it('reject by package version with RegExp', async () => {
            const pkg = {
                dependencies: {
                    'ncu-test-v2': '1.0.0',
                    'ncu-test-return-version': '1.0.1',
                    'fp-and-or': '0.1.0',
                },
            };
            const upgraded = await ncu.run({
                packageData: pkg,
                rejectVersion: /^1/,
            });
            upgraded.should.not.have.property('ncu-test-v2');
            upgraded.should.not.have.property('ncu-test-return-version');
            upgraded.should.have.property('fp-and-or');
        });
        it('reject by package version with RegExp string', async () => {
            const pkg = {
                dependencies: {
                    'ncu-test-v2': '1.0.0',
                    'ncu-test-return-version': '1.0.1',
                    'fp-and-or': '0.1.0',
                },
            };
            const upgraded = await ncu.run({
                packageData: pkg,
                rejectVersion: '/^1/',
            });
            upgraded.should.not.have.property('ncu-test-v2');
            upgraded.should.not.have.property('ncu-test-return-version');
            upgraded.should.have.property('fp-and-or');
        });
    });
    it('ignore non-string versions (sometimes used as comments)', async () => {
        const upgrades = await ncu.run({
            packageData: {
                dependencies: {
                    '//': 'This is a comment',
                },
            },
        });
        upgrades.should.deep.equal({});
    });
    it('update devDependency when duplicate dependency is up-to-date', async () => {
        const upgrades = await ncu.run({
            packageData: {
                dependencies: {
                    'ncu-test-v2': '^2.0.0',
                },
                devDependencies: {
                    'ncu-test-v2': '^1.0.0',
                },
            },
        });
        upgrades.should.deep.equal({
            'ncu-test-v2': '^2.0.0',
        });
    });
    it('update dependency when duplicate devDependency is up-to-date', async () => {
        const upgrades = await ncu.run({
            packageData: {
                dependencies: {
                    'ncu-test-v2': '^1.0.0',
                },
                devDependencies: {
                    'ncu-test-v2': '^2.0.0',
                },
            },
        });
        upgrades.should.deep.equal({
            'ncu-test-v2': '^2.0.0',
        });
    });
    // https://github.com/raineorshine/npm-check-updates/issues/1129
    it('ignore invalid semver version', async () => {
        const upgrades = await ncu.run({
            // needed to cause the npm package handler to use greatest or newest and compare all published versions
            target: 'minor',
            packageData: {
                dependencies: {
                    // grunt-contrib-requirejs contains 0.4.0rc7 which is not valid semver
                    'grunt-contrib-requirejs': '0.3.0',
                },
            },
        });
        upgrades.should.haveOwnProperty('grunt-contrib-requirejs');
    });
    it('ignore file: and link: protocols', async () => {
        const output = await ncu.run({
            packageData: {
                dependencies: {
                    editor: 'file:../editor',
                    event: 'link:../link',
                },
            },
        });
        output.should.deep.equal({});
    });
});
//# sourceMappingURL=index.test.js.map