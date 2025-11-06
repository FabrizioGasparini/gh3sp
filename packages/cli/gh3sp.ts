#!/usr/bin/env node

import { run } from "@cli/main.ts";
import { readFileSync } from "node:fs";
import process from "node:process";

const fileName = process.argv[2];

if (!fileName) {
    console.error("Usage: gh3sp <file.gh3>");
    process.exit(1);
}

if (fileName.startsWith("--")) {
    switch (fileName.split("--")[1]) {
        case "version": {
            console.log("Gh3sp v2.2.2");
            process.exit(0);
            break;
        }
    }
}

const code = readFileSync(fileName, "utf-8");
run(code);
