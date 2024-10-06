#!/usr/bin/env node

import { run } from "./main.ts";
import { readFileSync } from "node:fs";
import process from "node:process";

const fileName = process.argv[2];

if (!fileName) {
    console.error("Usage: gh3sp <file.gh3>");
    process.exit(1);
}

const code = readFileSync(fileName, "utf-8");
run(code);
