"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const parser_1 = __importDefault(require("./frontend/parser"));
const environments_1 = require("./runtime/environments");
const interpreter_1 = require("./runtime/interpreter");
function run(input) {
    const parser = new parser_1.default();
    const env = (0, environments_1.createGlobalEnvironment)();
    const program = parser.produceAST(input);
    (0, interpreter_1.evaluate)(program, env);
}
exports.run = run;
