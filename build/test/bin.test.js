"use strict";
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
const spawn_please_1 = __importDefault(require("spawn-please"));
chai_1.default.should();
chai_1.default.use(chai_as_promised_1.default);
chai_1.default.use(chai_string_1.default);
process.env.NCU_TESTS = 'true';
const bin = path_1.default.join(__dirname, '../build/src/bin/cli.js');
describe('bin', async function () {
    it('runs from the command line', async () => {
        await (0, spawn_please_1.default)('node', [bin], '{}');
    });
    it('output only upgraded with --jsonUpgraded', async () => {
        const output = await (0, spawn_please_1.default)('node', [bin, '--jsonUpgraded', '--stdin'], '{ "dependencies": { "express": "1" } }');
        const pkgData = JSON.parse(output);
        pkgData.should.have.property('express');
    });
    it('--loglevel verbose', async () => {
        const output = await (0, spawn_please_1.default)('node', [bin, '--loglevel', 'verbose'], '{ "dependencies": { "ncu-test-v2": "1.0.0" } }');
        output.should.containIgnoreCase('Initializing');
        output.should.containIgnoreCase('Running in local mode');
        output.should.containIgnoreCase('Finding package file data');
    });
    it('--verbose', async () => {
        const output = await (0, spawn_please_1.default)('node', [bin, '--verbose'], '{ "dependencies": { "ncu-test-v2": "1.0.0" } }');
        output.should.containIgnoreCase('Initializing');
        output.should.containIgnoreCase('Running in local mode');
        output.should.containIgnoreCase('Finding package file data');
    });
    it('accept stdin', async () => {
        const output = await (0, spawn_please_1.default)('node', [bin, '--stdin'], '{ "dependencies": { "express": "1" } }');
        output.trim().should.startWith('express');
    });
    it('reject out-of-date stdin with errorLevel 2', async () => {
        return (0, spawn_please_1.default)('node', [bin, '--stdin', '--errorLevel', '2'], '{ "dependencies": { "express": "1" } }').should.eventually.be.rejectedWith('Dependencies not up-to-date');
    });
    it('fall back to package.json search when receiving empty content on stdin', async () => {
        const stdout = await (0, spawn_please_1.default)('node', [bin, '--stdin']);
        stdout
            .toString()
            .trim()
            .should.match(/^Checking .+package.json/);
    });
    it('use package.json in cwd by default', async () => {
        const output = await (0, spawn_please_1.default)('node', [bin, '--jsonUpgraded'], { cwd: path_1.default.join(__dirname, 'ncu') });
        const pkgData = JSON.parse(output);
        pkgData.should.have.property('express');
    });
    it('handle no package.json to analyze when receiving empty content on stdin', async () => {
        // run from tmp dir to avoid ncu analyzing the project's package.json
        return (0, spawn_please_1.default)('node', [bin], { cwd: os_1.default.tmpdir() }).should.eventually.be.rejectedWith('No package.json');
    });
    it('read --packageFile', async () => {
        const tempDir = await promises_1.default.mkdtemp(path_1.default.join(os_1.default.tmpdir(), 'npm-check-updates-'));
        const pkgFile = path_1.default.join(tempDir, 'package.json');
        await promises_1.default.writeFile(pkgFile, '{ "dependencies": { "express": "1" } }', 'utf-8');
        try {
            const text = await (0, spawn_please_1.default)('node', [bin, '--jsonUpgraded', '--packageFile', pkgFile]);
            const pkgData = JSON.parse(text);
            pkgData.should.have.property('express');
        }
        finally {
            await promises_1.default.rm(tempDir, { recursive: true, force: true });
        }
    });
    it('write to --packageFile', async () => {
        const tempDir = await promises_1.default.mkdtemp(path_1.default.join(os_1.default.tmpdir(), 'npm-check-updates-'));
        const pkgFile = path_1.default.join(tempDir, 'package.json');
        await promises_1.default.writeFile(pkgFile, '{ "dependencies": { "express": "1" } }', 'utf-8');
        try {
            await (0, spawn_please_1.default)('node', [bin, '-u', '--packageFile', pkgFile]);
            const upgradedPkg = JSON.parse(await promises_1.default.readFile(pkgFile, 'utf-8'));
            upgradedPkg.should.have.property('dependencies');
            upgradedPkg.dependencies.should.have.property('express');
            upgradedPkg.dependencies.express.should.not.equal('1');
        }
        finally {
            await promises_1.default.rm(tempDir, { recursive: true, force: true });
        }
    });
    it('write to --packageFile if errorLevel=2 and upgrades', async () => {
        const tempDir = await promises_1.default.mkdtemp(path_1.default.join(os_1.default.tmpdir(), 'npm-check-updates-'));
        const pkgFile = path_1.default.join(tempDir, 'package.json');
        await promises_1.default.writeFile(pkgFile, '{ "dependencies": { "express": "1" } }', 'utf-8');
        try {
            await (0, spawn_please_1.default)('node', [bin, '-u', '--errorLevel', '2', '--packageFile', pkgFile]).should.eventually.be.rejectedWith('Dependencies not up-to-date');
            const upgradedPkg = JSON.parse(await promises_1.default.readFile(pkgFile, 'utf-8'));
            upgradedPkg.should.have.property('dependencies');
            upgradedPkg.dependencies.should.have.property('express');
            upgradedPkg.dependencies.express.should.not.equal('1');
        }
        finally {
            await promises_1.default.rm(tempDir, { recursive: true, force: true });
        }
    });
    it('write to --packageFile with jsonUpgraded flag', async () => {
        const tempDir = await promises_1.default.mkdtemp(path_1.default.join(os_1.default.tmpdir(), 'npm-check-updates-'));
        const pkgFile = path_1.default.join(tempDir, 'package.json');
        await promises_1.default.writeFile(pkgFile, '{ "dependencies": { "express": "1" } }', 'utf-8');
        try {
            await (0, spawn_please_1.default)('node', [bin, '-u', '--jsonUpgraded', '--packageFile', pkgFile]);
            const ugradedPkg = JSON.parse(await promises_1.default.readFile(pkgFile, 'utf-8'));
            ugradedPkg.should.have.property('dependencies');
            ugradedPkg.dependencies.should.have.property('express');
            ugradedPkg.dependencies.express.should.not.equal('1');
        }
        finally {
            await promises_1.default.rm(tempDir, { recursive: true, force: true });
        }
    });
    it('ignore stdin if --packageFile is specified', async () => {
        const tempDir = await promises_1.default.mkdtemp(path_1.default.join(os_1.default.tmpdir(), 'npm-check-updates-'));
        const pkgFile = path_1.default.join(tempDir, 'package.json');
        await promises_1.default.writeFile(pkgFile, '{ "dependencies": { "express": "1" } }', 'utf-8');
        try {
            await (0, spawn_please_1.default)('node', [bin, '-u', '--stdin', '--packageFile', pkgFile], '{ "dependencies": {}}');
            const upgradedPkg = JSON.parse(await promises_1.default.readFile(pkgFile, 'utf-8'));
            upgradedPkg.should.have.property('dependencies');
            upgradedPkg.dependencies.should.have.property('express');
            upgradedPkg.dependencies.express.should.not.equal('1');
        }
        finally {
            await promises_1.default.rm(tempDir, { recursive: true, force: true });
        }
    });
    it('suppress stdout when --silent is provided', async () => {
        const output = await (0, spawn_please_1.default)('node', [bin, '--silent'], '{ "dependencies": { "express": "1" } }');
        output.trim().should.equal('');
    });
    describe('filter', () => {
        it('filter by package name with --filter', async () => {
            const output = await (0, spawn_please_1.default)('node', [bin, '--jsonUpgraded', '--stdin', '--filter', 'express'], '{ "dependencies": { "express": "1", "chalk": "0.1.0" } }');
            const pkgData = JSON.parse(output);
            pkgData.should.have.property('express');
            pkgData.should.not.have.property('chalk');
        });
        it('filter by package name with -f', async () => {
            const output = await (0, spawn_please_1.default)('node', [bin, '--jsonUpgraded', '--stdin', '-f', 'express'], '{ "dependencies": { "express": "1", "chalk": "0.1.0" } }');
            const pkgData = JSON.parse(output);
            pkgData.should.have.property('express');
            pkgData.should.not.have.property('chalk');
        });
    });
    it('do not allow non-matching --filter and arguments', async () => {
        const pkgData = {
            dependencies: {
                'lodash.map': '2.0.0',
                'lodash.filter': '2.0.0',
            },
        };
        await (0, spawn_please_1.default)('node', [bin, '--jsonUpgraded', '--filter', 'lodash.map', 'lodash.filter'], JSON.stringify(pkgData))
            .should.eventually.be.rejected;
    });
    it('allow matching --filter and arguments', async () => {
        const pkgData = {
            dependencies: {
                'lodash.map': '2.0.0',
                'lodash.filter': '2.0.0',
            },
        };
        const output = await (0, spawn_please_1.default)('node', [bin, '--jsonUpgraded', '--stdin', '--filter', 'lodash.map lodash.filter', 'lodash.map', 'lodash.filter'], JSON.stringify(pkgData));
        const upgraded = JSON.parse(output);
        upgraded.should.have.property('lodash.map');
        upgraded.should.have.property('lodash.filter');
    });
});
describe('reject', () => {
    it('reject by package name with --reject', async () => {
        const output = await (0, spawn_please_1.default)('node', [bin, '--jsonUpgraded', '--stdin', '--reject', 'chalk'], '{ "dependencies": { "express": "1", "chalk": "0.1.0" } }');
        const pkgData = JSON.parse(output);
        pkgData.should.have.property('express');
        pkgData.should.not.have.property('chalk');
    });
    it('reject by package name with -x', async () => {
        const output = await (0, spawn_please_1.default)('node', [bin, '--jsonUpgraded', '--stdin', '-x', 'chalk'], '{ "dependencies": { "express": "1", "chalk": "0.1.0" } }');
        const pkgData = JSON.parse(output);
        pkgData.should.have.property('express');
        pkgData.should.not.have.property('chalk');
    });
    it('reject with empty string should not reject anything', async () => {
        const output = await (0, spawn_please_1.default)('node', [bin, '--jsonUpgraded', '--reject', '""', '--stdin', '-x', 'chalk'], '{ "dependencies": { "ncu-test-v2": "1.0.0", "ncu-test-tag": "1.0.0" } }');
        const pkgData = JSON.parse(output);
        pkgData.should.have.property('ncu-test-v2');
        pkgData.should.have.property('ncu-test-tag');
    });
});
describe('rc-config', () => {
    it('print rcConfigPath when there is a non-empty rc config file', async () => {
        const tempDir = await promises_1.default.mkdtemp(path_1.default.join(os_1.default.tmpdir(), 'npm-check-updates-'));
        const tempConfigFile = path_1.default.join(tempDir, '.ncurc.json');
        await promises_1.default.writeFile(tempConfigFile, '{"filter": "express"}', 'utf-8');
        try {
            const text = await (0, spawn_please_1.default)('node', [bin, '--configFilePath', tempDir], '{ "dependencies": { "express": "1", "chalk": "0.1.0" } }');
            text.should.containIgnoreCase(`Using config file ${tempConfigFile}`);
        }
        finally {
            await promises_1.default.rm(tempDir, { recursive: true, force: true });
        }
    });
    it('do not print rcConfigPath when there is no rc config file', async () => {
        const text = await (0, spawn_please_1.default)('node', [bin], '{ "dependencies": { "express": "1", "chalk": "0.1.0" } }');
        text.should.not.include('Using config file');
    });
    it('do not print rcConfigPath when there is an empty rc config file', async () => {
        const tempDir = await promises_1.default.mkdtemp(path_1.default.join(os_1.default.tmpdir(), 'npm-check-updates-'));
        const tempConfigFile = path_1.default.join(tempDir, '.ncurc.json');
        await promises_1.default.writeFile(tempConfigFile, '{}', 'utf-8');
        try {
            const text = await (0, spawn_please_1.default)('node', [bin, '--configFilePath', tempDir], '{ "dependencies": { "express": "1", "chalk": "0.1.0" } }');
            text.should.not.include('Using config file');
        }
        finally {
            await promises_1.default.rm(tempDir, { recursive: true, force: true });
        }
    });
    it('read --configFilePath', async () => {
        const tempDir = await promises_1.default.mkdtemp(path_1.default.join(os_1.default.tmpdir(), 'npm-check-updates-'));
        const tempConfigFile = path_1.default.join(tempDir, '.ncurc.json');
        await promises_1.default.writeFile(tempConfigFile, '{"jsonUpgraded": true, "filter": "express"}', 'utf-8');
        try {
            const text = await (0, spawn_please_1.default)('node', [bin, '--stdin', '--configFilePath', tempDir], '{ "dependencies": { "express": "1", "chalk": "0.1.0" } }');
            const pkgData = JSON.parse(text);
            pkgData.should.have.property('express');
            pkgData.should.not.have.property('chalk');
        }
        finally {
            await promises_1.default.rm(tempDir, { recursive: true, force: true });
        }
    });
    it('read --configFileName', async () => {
        const tempDir = await promises_1.default.mkdtemp(path_1.default.join(os_1.default.tmpdir(), 'npm-check-updates-'));
        const tempConfigFileName = '.rctemp.json';
        const tempConfigFile = path_1.default.join(tempDir, tempConfigFileName);
        await promises_1.default.writeFile(tempConfigFile, '{"jsonUpgraded": true, "filter": "express"}', 'utf-8');
        try {
            const text = await (0, spawn_please_1.default)('node', [bin, '--stdin', '--configFilePath', tempDir, '--configFileName', tempConfigFileName], '{ "dependencies": { "express": "1", "chalk": "0.1.0" } }');
            const pkgData = JSON.parse(text);
            pkgData.should.have.property('express');
            pkgData.should.not.have.property('chalk');
        }
        finally {
            await promises_1.default.rm(tempDir, { recursive: true, force: true });
        }
    });
    it('override config with arguments', async () => {
        const tempDir = await promises_1.default.mkdtemp(path_1.default.join(os_1.default.tmpdir(), 'npm-check-updates-'));
        const tempConfigFile = path_1.default.join(tempDir, '.ncurc.json');
        await promises_1.default.writeFile(tempConfigFile, '{"jsonUpgraded": true, "filter": "express"}', 'utf-8');
        try {
            const text = await (0, spawn_please_1.default)('node', [bin, '--stdin', '--configFilePath', tempDir, '--filter', 'chalk'], '{ "dependencies": { "express": "1", "chalk": "0.1.0" } }');
            const pkgData = JSON.parse(text);
            pkgData.should.have.property('chalk');
            pkgData.should.not.have.property('express');
        }
        finally {
            await promises_1.default.rm(tempDir, { recursive: true, force: true });
        }
    });
    it('handle boolean arguments', async () => {
        const tempDir = await promises_1.default.mkdtemp(path_1.default.join(os_1.default.tmpdir(), 'npm-check-updates-'));
        const tempConfigFile = path_1.default.join(tempDir, '.ncurc.json');
        // if boolean arguments are not handled as a special case, ncu will incorrectly pass "--deep false" to commander, which will interpret it as two args, i.e. --deep and --filter false
        await promises_1.default.writeFile(tempConfigFile, '{"jsonUpgraded": true, "deep": false }', 'utf-8');
        try {
            const text = await (0, spawn_please_1.default)('node', [bin, '--stdin', '--configFilePath', tempDir], '{ "dependencies": { "chalk": "0.1.0" } }');
            const pkgData = JSON.parse(text);
            pkgData.should.have.property('chalk');
        }
        finally {
            await promises_1.default.rm(tempDir, { recursive: true, force: true });
        }
    });
    describe('with timeout option', () => {
        it('exit with error when timeout exceeded', async () => {
            return (0, spawn_please_1.default)('node', [bin, '--timeout', '1'], '{ "dependencies": { "express": "1" } }').should.eventually.be.rejectedWith('Exceeded global timeout of 1ms');
        });
        it('completes successfully with timeout', async () => {
            return (0, spawn_please_1.default)('node', [bin, '--timeout', '100000'], '{ "dependencies": { "express": "1" } }');
        });
    });
    describe('embedded versions', () => {
        it('strip url from Github url in "to" output', async () => {
            // use dynamic import for ESM module
            const { default: stripAnsi } = await import('strip-ansi');
            const dependencies = {
                'ncu-test-v2': 'https://github.com/raineorshine/ncu-test-v2.git#v1.0.0',
            };
            const output = await (0, spawn_please_1.default)('node', [bin, '--stdin'], JSON.stringify({ dependencies }));
            stripAnsi(output)
                .trim()
                .should.equal('ncu-test-v2  https://github.com/raineorshine/ncu-test-v2.git#v1.0.0  →  v2.0.0');
        });
        it('strip prefix from npm alias in "to" output', async () => {
            // use dynamic import for ESM module
            const { default: stripAnsi } = await import('strip-ansi');
            const dependencies = {
                request: 'npm:ncu-test-v2@1.0.0',
            };
            const output = await (0, spawn_please_1.default)('node', [bin, '--stdin'], JSON.stringify({ dependencies }));
            stripAnsi(output).trim().should.equal('request  npm:ncu-test-v2@1.0.0  →  2.0.0');
        });
    });
    describe('option-specific help', () => {
        it('long option', async () => {
            const output = await (0, spawn_please_1.default)('node', [bin, '--help', '--filter']);
            output.trim().should.startWith('Usage: ncu --filter');
        });
        it('long option without "--" prefix', async () => {
            const output = await (0, spawn_please_1.default)('node', [bin, '--help', '-f']);
            output.trim().should.startWith('Usage: ncu --filter');
        });
        it('short option', async () => {
            const output = await (0, spawn_please_1.default)('node', [bin, '--help', 'filter']);
            output.trim().should.startWith('Usage: ncu --filter');
        });
        it('short option without "-" prefix', async () => {
            const output = await (0, spawn_please_1.default)('node', [bin, '--help', 'f']);
            output.trim().should.startWith('Usage: ncu --filter');
        });
        it('option with default', async () => {
            const output = await (0, spawn_please_1.default)('node', [bin, '--help', '--concurrency']);
            output.trim().should.containIgnoreCase('Default:');
        });
        it('option with extended help', async () => {
            const output = await (0, spawn_please_1.default)('node', [bin, '--help', '--target']);
            output.trim().should.containIgnoreCase('Upgrade to the highest version number');
            // run extended help on other options for test coverage
            await (0, spawn_please_1.default)('node', [bin, '--help', 'doctor']);
            await (0, spawn_please_1.default)('node', [bin, '--help', 'format']);
            await (0, spawn_please_1.default)('node', [bin, '--help', 'group']);
            await (0, spawn_please_1.default)('node', [bin, '--help', 'packageManager']);
            await (0, spawn_please_1.default)('node', [bin, '--help', 'peer']);
        });
        it('unknown option', async () => {
            const output = await (0, spawn_please_1.default)('node', [bin, '--help', '--foo']);
            output.trim().should.containIgnoreCase('Unknown option');
        });
        it('special --help --help', async () => {
            const output = await (0, spawn_please_1.default)('node', [bin, '--help', '--help']);
            output.trim().should.not.include('Usage');
        });
        it('ignore file: and link: protocols', async () => {
            const { default: stripAnsi } = await import('strip-ansi');
            const dependencies = {
                editor: 'file:../editor',
                event: 'link:../link',
            };
            const output = await (0, spawn_please_1.default)('node', [bin, '--stdin'], JSON.stringify({ dependencies }));
            stripAnsi(output).should.not.include('No package versions were returned. This is likely a problem with your installed npm');
        });
    });
});
//# sourceMappingURL=bin.test.js.map