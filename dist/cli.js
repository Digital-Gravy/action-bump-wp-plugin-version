"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateBumpType = validateBumpType;
exports.validatePrereleaseType = validatePrereleaseType;
exports.main = main;
const versionBumper_1 = require("./versionBumper");
function validateBumpType(type) {
    if (!Object.values(versionBumper_1.BumpTypes).includes(type)) {
        throw new Error(`Invalid bump type: ${type}. Valid types are: ${Object.values(versionBumper_1.BumpTypes).join(', ')}`);
    }
    return type;
}
function validatePrereleaseType(type) {
    if (!Object.values(versionBumper_1.PrereleaseTypes).includes(type)) {
        throw new Error(`Invalid prerelease type: ${type}. Valid types are: ${Object.values(versionBumper_1.PrereleaseTypes).join(', ')}`);
    }
    return type;
}
function main() {
    try {
        // Get command line arguments with defaults
        const bumpType = validateBumpType(process.argv[2] || 'patch');
        const prereleaseType = validatePrereleaseType(process.argv[3] || 'none');
        const pluginDir = process.argv[4] || '.';
        const pluginMainFile = process.argv[5] || 'plugin.php';
        const pluginFilePath = `${pluginDir}/${pluginMainFile}`;
        const sureCartReleaseFile = process.argv[6]; // Optional SureCart release file
        const sureCartReleaseFilePath = sureCartReleaseFile
            ? `${pluginDir}/${sureCartReleaseFile}`
            : undefined;
        console.log('Inputs received:');
        console.log(`  bump_type: ${bumpType}`);
        console.log(`  prerelease_type: ${prereleaseType}`);
        console.log(`  plugin_dir: ${pluginDir}`);
        console.log(`  plugin_main_file: ${pluginMainFile}`);
        console.log(`  plugin_file_path: ${pluginFilePath}`);
        console.log(`  surecart_release_file: ${sureCartReleaseFile}`);
        console.log(`  surecart_release_file_path: ${sureCartReleaseFilePath}`);
        // Run the bump
        const result = (0, versionBumper_1.bumpVersion)(pluginFilePath, bumpType, prereleaseType, sureCartReleaseFilePath);
        // Output the result
        console.log('\n');
        console.log('Result:');
        console.log('  Version bump successful:');
        console.log(`  Old version: ${result.oldVersion}`);
        console.log(`  New version: ${result.newVersion}`);
        console.log(`  Version bumped: ${result.isVersionBumped}`);
        // Exit with success
        process.exit(0);
    }
    catch (error) {
        // Handle errors
        console.error('Error:', error instanceof Error ? error.message : error);
        process.exit(1);
    }
}
// Only run if this file is being executed directly
if (require.main === module) {
    main();
}
