"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = __importDefault(require("chai"));
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const src_1 = __importDefault(require("../src"));
chai_1.default.should();
process.env.NCU_TESTS = 'true';
describe('filter', () => {
    it('filter by package name with one arg', async () => {
        const upgraded = (await (0, src_1.default)({
            packageData: await promises_1.default.readFile(path_1.default.join(__dirname, './ncu/package2.json'), 'utf-8'),
            filter: ['lodash.map'],
        }));
        upgraded.should.have.property('lodash.map');
        upgraded.should.not.have.property('lodash.filter');
    });
    it('filter by package name with multiple args', async () => {
        const upgraded = (await (0, src_1.default)({
            packageData: await promises_1.default.readFile(path_1.default.join(__dirname, './ncu/package2.json'), 'utf-8'),
            filter: ['lodash.map', 'lodash.filter'],
        }));
        upgraded.should.have.property('lodash.map');
        upgraded.should.have.property('lodash.filter');
    });
    it('filter with wildcard', async () => {
        const upgraded = (await (0, src_1.default)({
            packageData: {
                dependencies: {
                    lodash: '2.0.0',
                    'lodash.map': '2.0.0',
                    'lodash.filter': '2.0.0',
                },
            },
            filter: ['lodash.*'],
        }));
        upgraded.should.have.property('lodash.map');
        upgraded.should.have.property('lodash.filter');
    });
    it('filter with wildcard for scoped package', async () => {
        const pkg = {
            dependencies: {
                vite: '1.0.0',
                '@vitejs/plugin-react': '1.0.0',
                '@vitejs/plugin-vue': '1.0.0',
            },
        };
        {
            const upgraded = await (0, src_1.default)({ packageData: pkg, filter: ['vite'] });
            upgraded.should.have.property('vite');
            upgraded.should.not.have.property('@vitejs/plugin-react');
            upgraded.should.not.have.property('@vitejs/plugin-vue');
        }
        {
            const upgraded = await (0, src_1.default)({ packageData: pkg, filter: ['@vite*'] });
            upgraded.should.not.have.property('vite');
            upgraded.should.have.property('@vitejs/plugin-react');
            upgraded.should.have.property('@vitejs/plugin-vue');
        }
        {
            const upgraded = await (0, src_1.default)({ packageData: pkg, filter: ['*vite*'] });
            upgraded.should.have.property('vite');
            upgraded.should.have.property('@vitejs/plugin-react');
            upgraded.should.have.property('@vitejs/plugin-vue');
        }
        {
            const upgraded = await (0, src_1.default)({ packageData: pkg, filter: ['*vite*/*react*'] });
            upgraded.should.not.have.property('vite');
            upgraded.should.have.property('@vitejs/plugin-react');
            upgraded.should.not.have.property('@vitejs/plugin-vue');
        }
        {
            const upgraded = await (0, src_1.default)({ packageData: pkg, filter: ['*vite*vue*'] });
            upgraded.should.not.have.property('vite');
            upgraded.should.not.have.property('@vitejs/plugin-react');
            upgraded.should.have.property('@vitejs/plugin-vue');
        }
    });
    it('filter with negated wildcard', async () => {
        const upgraded = (await (0, src_1.default)({
            packageData: {
                dependencies: {
                    lodash: '2.0.0',
                    'lodash.map': '2.0.0',
                    'lodash.filter': '2.0.0',
                },
            },
            filter: ['!lodash.*'],
        }));
        upgraded.should.have.property('lodash');
    });
    it('filter with regex string', async () => {
        const upgraded = (await (0, src_1.default)({
            packageData: {
                dependencies: {
                    lodash: '2.0.0',
                    'lodash.map': '2.0.0',
                    'lodash.filter': '2.0.0',
                },
            },
            filter: '/lodash\\..*/',
        }));
        upgraded.should.have.property('lodash.map');
        upgraded.should.have.property('lodash.filter');
    });
    it('filter with array of strings', async () => {
        const upgraded = (await (0, src_1.default)({
            packageData: {
                dependencies: {
                    lodash: '2.0.0',
                    'lodash.map': '2.0.0',
                    'lodash.filter': '2.0.0',
                },
            },
            filter: ['lodash.map', 'lodash.filter'],
        }));
        upgraded.should.have.property('lodash.map');
        upgraded.should.have.property('lodash.filter');
    });
    it('filter with array of regex', async () => {
        const upgraded = (await (0, src_1.default)({
            packageData: {
                dependencies: {
                    'fp-and-or': '0.1.0',
                    lodash: '2.0.0',
                    'lodash.map': '2.0.0',
                    'lodash.filter': '2.0.0',
                },
            },
            filter: [/lodash\..*/, /fp.*/],
        }));
        upgraded.should.have.property('lodash.map');
        upgraded.should.have.property('lodash.filter');
        upgraded.should.have.property('fp-and-or');
    });
    it('filter with array of regex strings', async () => {
        const upgraded = (await (0, src_1.default)({
            packageData: {
                dependencies: {
                    'fp-and-or': '0.1.0',
                    lodash: '2.0.0',
                    'lodash.map': '2.0.0',
                    'lodash.filter': '2.0.0',
                },
            },
            filter: ['/lodash\\..*/', '/fp.*/'],
        }));
        upgraded.should.have.property('lodash.map');
        upgraded.should.have.property('lodash.filter');
        upgraded.should.have.property('fp-and-or');
    });
});
//# sourceMappingURL=filter.test.js.map