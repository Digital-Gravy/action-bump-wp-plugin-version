import { BumpType, PrereleaseType, bumpVersion } from './versionBumper';

// Get command line arguments with defaults
const bumpType = process.argv[2] || 'patch';
const prereleaseType = process.argv[3] || 'none';
const pluginDir = process.argv[4] || '.';
const pluginMainFile = process.argv[5] || 'plugin.php';
const filePath = `${pluginDir}/${pluginMainFile}`;

// Run the bump
const result = bumpVersion(filePath, bumpType as BumpType, prereleaseType as PrereleaseType);

console.log('Result:', result);
