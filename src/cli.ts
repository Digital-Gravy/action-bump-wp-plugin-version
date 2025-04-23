import { BumpType, PrereleaseType, BumpTypes, PrereleaseTypes, bumpVersion } from './versionBumper';

function validateBumpType(type: string): BumpType {
  if (!Object.values(BumpTypes).includes(type as BumpType)) {
    throw new Error(
      `Invalid bump type: ${type}. Valid types are: ${Object.values(BumpTypes).join(', ')}`
    );
  }
  return type as BumpType;
}

function validatePrereleaseType(type: string): PrereleaseType {
  if (!Object.values(PrereleaseTypes).includes(type as PrereleaseType)) {
    throw new Error(
      `Invalid prerelease type: ${type}. Valid types are: ${Object.values(PrereleaseTypes).join(', ')}`
    );
  }
  return type as PrereleaseType;
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
    const result = bumpVersion(pluginFilePath, bumpType, prereleaseType, sureCartReleaseFilePath);

    // Output the result
    console.log('\n');
    console.log('Result:');
    console.log('  Version bump successful:');
    console.log(`  Old version: ${result.oldVersion}`);
    console.log(`  New version: ${result.newVersion}`);
    console.log(`  Version bumped: ${result.isVersionBumped}`);

    // Exit with success
    process.exit(0);
  } catch (error) {
    // Handle errors
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Only run if this file is being executed directly
if (require.main === module) {
  main();
}

// Export for testing
export { validateBumpType, validatePrereleaseType, main };
