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
    const pluginFilePath = `${pluginDir}/${pluginMainFile}`;
    const sureCartReleaseFile = core.getInput('surecart_release_file');
    const sureCartReleaseFilePath = sureCartReleaseFile
      ? `${pluginDir}/${sureCartReleaseFile}`
      : undefined;

    // Debug input values
    core.debug('Inputs received:');
    core.debug(`  bump_type: ${bumpType}`);
    core.debug(`  prerelease_type: ${prereleaseType}`);
    core.debug(`  plugin_dir: ${pluginDir}`);
    core.debug(`  plugin_main_file: ${pluginMainFile}`);
    core.debug(`  plugin_file_path: ${pluginFilePath}`);
    core.debug(`  surecart_release_file: ${sureCartReleaseFile}`);
    core.debug(`  surecart_release_file_path: ${sureCartReleaseFilePath}`);

    const { oldVersion, newVersion, isVersionBumped }: VersionResult = bumpVersion(
      pluginFilePath,
      bumpType as BumpType,
      prereleaseType as PrereleaseType,
      sureCartReleaseFilePath
    );

    // Output results with visual separation
    core.info('WordPress Plugin Version Bumper Results');
    core.info('═══════════════════════════════════════');
    core.info(`Old Version: ${oldVersion}`);
    core.info(`New Version: ${newVersion}`);
    core.info(`Version Bumped: ${isVersionBumped}`);
    if (isVersionBumped) {
      core.info(`File Updated: ${pluginFilePath}`);
      if (sureCartReleaseFilePath) {
        core.info(`SureCart Release File Updated: ${sureCartReleaseFilePath}`);
      }
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
