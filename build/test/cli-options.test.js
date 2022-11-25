"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = __importDefault(require("chai"));
const cli_options_1 = __importDefault(require("../src/cli-options"));
chai_1.default.should();
describe('cli-options', () => {
    it('require long and description properties', () => {
        cli_options_1.default.forEach(option => {
            option.should.have.property('long');
            option.should.have.property('description');
        });
    });
});
//# sourceMappingURL=cli-options.test.js.map