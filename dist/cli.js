"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const versionBumper_1 = require("./versionBumper");
// Get command line arguments with defaults
const bumpType = process.argv[2] || 'patch';
const prereleaseType = process.argv[3] || 'none';
const pluginDir = process.argv[4] || '.';
const pluginMainFile = process.argv[5] || 'plugin.php';
const filePath = `${pluginDir}/${pluginMainFile}`;
// Run the bump
const result = (0, versionBumper_1.bumpVersion)(filePath, bumpType, prereleaseType);
console.log('Result:', result);
