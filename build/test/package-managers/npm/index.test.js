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
const npm = __importStar(require("../../../src/package-managers/npm"));
chai_1.default.should();
chai_1.default.use(chai_as_promised_1.default);
describe('npm', function () {
    it('list', async () => {
        const versionObject = await npm.list({ cwd: __dirname });
        versionObject.should.have.property('express');
    });
    it('latest', async () => {
        const version = await npm.latest('express', '', { cwd: __dirname });
        parseInt(version, 10).should.be.above(1);
    });
    it('greatest', async () => {
        const version = await npm.greatest('ncu-test-greatest-not-newest', '', { pre: true, cwd: __dirname });
        version.should.equal('2.0.0-beta');
    });
    it('ownerChanged', async () => {
        await npm.packageAuthorChanged('mocha', '^7.1.0', '8.0.1').should.eventually.equal(true);
        await npm.packageAuthorChanged('htmlparser2', '^3.10.1', '^4.0.0').should.eventually.equal(false);
        await npm.packageAuthorChanged('ncu-test-v2', '^1.0.0', '2.2.0').should.eventually.equal(false);
    });
    it('getPeerDependencies', async () => {
        await npm.getPeerDependencies('ncu-test-return-version', '1.0').should.eventually.deep.equal({});
        await npm.getPeerDependencies('ncu-test-peer', '1.0').should.eventually.deep.equal({
            'ncu-test-return-version': '1.x',
        });
    });
});
//# sourceMappingURL=index.test.js.map