#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const main_1 = require("./main");
const node_fs_1 = require("node:fs");
const node_process_1 = __importDefault(require("node:process"));
const fileName = node_process_1.default.argv[2];
if (!fileName) {
    console.error("Usage: gh3sp <file.gh3>");
    node_process_1.default.exit(1);
}
const code = (0, node_fs_1.readFileSync)(fileName, 'utf-8');
(0, main_1.run)(code);
