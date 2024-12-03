import * as core from '@actions/core';
import { bumpVersion, VersionResult, BumpType, PrereleaseType } from './versionBumper';

/**
 * Run the action
 */
function run(): void {
  try {
    const bumpType = core.getInput('bump_type');
    const prereleaseType = core.getInput('prerelease_type');
    const pluginDir = core.getInput('plugin_dir');
    const pluginMainFile = core.getInput('plugin_main_file');

    // Debug input values
    core.debug('Inputs received:');
    core.debug(`  bump_type: ${bumpType}`);
    core.debug(`  prerelease_type: ${prereleaseType}`);
    core.debug(`  plugin_dir: ${pluginDir}`);
    core.debug(`  plugin_main_file: ${pluginMainFile}`);

    const filePath = `${pluginDir}/${pluginMainFile}`;
    const { oldVersion, newVersion, isVersionBumped }: VersionResult = bumpVersion(
      filePath,
      bumpType as BumpType,
      prereleaseType as PrereleaseType
    );

    // Output results with visual separation
    core.info('WordPress Plugin Version Bumper Results');
    core.info('═══════════════════════════════════════');
    core.info(`Old Version: ${oldVersion}`);
    core.info(`New Version: ${newVersion}`);
    core.info(`Version Bumped: ${isVersionBumped}`);
    if (isVersionBumped) {
      core.info(`File Updated: ${filePath}`);
    }

    core.setOutput('old_version', oldVersion);
    core.setOutput('new_version', newVersion);
    core.setOutput('is_version_bumped', isVersionBumped);

    if (isVersionBumped) {
      core.notice(`Version bumped from ${oldVersion} to ${newVersion}`);
    } else {
      core.notice('No version change needed');
    }
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    } else {
      core.setFailed('An unknown error occurred');
    }
  }
}

export { bumpVersion };

if (require.main === module) {
  run();
}
