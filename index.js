const core = require('@actions/core');
const fs = require('fs');
const path = require('path');

/**
 * Get the current version from the plugin file
 *
 * @param {string} pluginDir The directory where the plugin file is located
 * @param {string} pluginMainFile The main plugin file
 * @returns {string} The current version
 */
function getCurrentVersion(pluginDir, pluginMainFile) {
  const filePath = path.join(pluginDir, pluginMainFile);

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const versionMatch = content.match(/Version:\s*([^*\n\r]*)/);

    if (!versionMatch || !versionMatch[1] || !versionMatch[1].trim()) {
      throw new Error('Version header not found in plugin file');
    }

    const version = versionMatch[1].trim();
    if (!parseVersion(version)) {
      throw new Error(`Invalid version format found in plugin file: "${version}"`);
    }

    return version;
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`Plugin file not found at: ${filePath}`);
    }
    throw error;
  }
}

/**
 * Parse the version string into an object
 *
 * @param {string} version The version string
 * @returns {object} The parsed version object
 */
function parseVersion(version) {
  // format: major.minor.patch[-prerelease-prereleaseNum][+build]
  // example: 1.2.3-alpha-1+20210101120000
  const regex = /^(\d+)\.(\d+)\.(\d+)(?:-([a-z]+)-(\d+))?(?:\+(\d{14}))?$/;
  const match = version.match(regex);

  if (!match) return null;

  return {
    major: parseInt(match[1]),
    minor: parseInt(match[2]),
    patch: parseInt(match[3]),
    prereleaseType: match[4] || null,
    prereleaseNum: match[5] ? parseInt(match[5]) : null,
    build: match[6] || null,
  };
}

/**
 * Get the order of prerelease types
 * @param {string} type The prerelease type
 * @returns {number} The order of the prerelease type
 * @returns {number} -1 if the type is not found
 * @returns {number} 0 for dev
 * @returns {number} 1 for alpha
 * @returns {number} 2 for beta
 * @returns {number} 3 for rc
 */
function getPrereleaseOrder(type) {
  const order = { dev: 0, alpha: 1, beta: 2, rc: 3 };
  return order[type] || -1;
}

/**
 * Generate a timestamp string
 * @returns {string} The timestamp string
 * @example
 * generateTimestamp(); // '20210101120000'
 */
function generateTimestamp() {
  return new Date()
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, '')
    .replace('T', '');
}

/**
 * Bump the version
 * @param {string} currentVersion The current version
 * @param {string} bumpType The type of bump (major, minor, patch, build)
 * @param {string} prereleaseType The type of prerelease (none, alpha, beta, rc)
 * @returns {string} The new version
 */
function bumpVersion(currentVersion, bumpType, prereleaseType) {
  const parsed = parseVersion(currentVersion);
  if (!parsed) throw new Error('Invalid version format');

  const newVersion = { ...parsed };

  // Handle pure prerelease bumps
  if (bumpType === 'none' && prereleaseType !== 'none') {
    // Ensure you can't downgrade prerelease type
    if (
      parsed.prereleaseType &&
      getPrereleaseOrder(prereleaseType) < getPrereleaseOrder(parsed.prereleaseType)
    ) {
      throw new Error('Cannot downgrade prerelease type');
    }
    // Handle progression of existing prerelease
    if (parsed.prereleaseType === prereleaseType) {
      newVersion.prereleaseNum = parsed.prereleaseNum + 1;
      return formatVersion(newVersion);
    }
    // Handle new prerelease
    newVersion.prereleaseNum = 1;
    newVersion.prereleaseType = prereleaseType;
    return formatVersion(newVersion);
  }

  // Handle stable releases
  switch (bumpType) {
    case 'major':
      newVersion.major += 1;
      newVersion.minor = 0;
      newVersion.patch = 0;
      newVersion.build = null;
      break;
    case 'minor':
      newVersion.minor += 1;
      newVersion.patch = 0;
      newVersion.build = null;
      break;
    case 'patch':
      newVersion.patch += 1;
      newVersion.build = null;
      break;
    case 'build':
      newVersion.build = generateTimestamp();
      break;
  }

  // Handle prerelease bumps for stable releases
  if (prereleaseType !== 'none' && bumpType !== 'build') {
    newVersion.prereleaseType = prereleaseType;
    newVersion.prereleaseNum = 1;
  } else if (bumpType !== 'build') {
    newVersion.prereleaseType = null;
    newVersion.prereleaseNum = null;
  }

  return formatVersion(newVersion);
}

/**
 * Format the version object into a string
 * @param {object} version The version object
 * @returns {string} The formatted version string
 */
function formatVersion(version) {
  let formatted = `${version.major}.${version.minor}.${version.patch}`;
  if (version.prereleaseType) {
    formatted += `-${version.prereleaseType}-${version.prereleaseNum}`;
  }
  if (version.build) {
    formatted += `+${version.build}`;
  }
  return formatted;
}

/**
 * Run the action
 */
function run() {
  try {
    const bumpType = core.getInput('bump_type');
    const prereleaseType = core.getInput('prerelease_type');
    const pluginDir = core.getInput('plugin_dir');
    const mainFile = core.getInput('main_file');

    // Debug input values
    core.debug('Inputs received:');
    core.debug(`  bump_type: ${bumpType}`);
    core.debug(`  prerelease_type: ${prereleaseType}`);
    core.debug(`  plugin_dir: ${pluginDir}`);
    core.debug(`  main_file: ${mainFile}`);

    const oldVersion = getCurrentVersion(pluginDir, mainFile);
    const newVersion = bumpVersion(oldVersion, bumpType, prereleaseType);
    const isVersionBumped = oldVersion !== newVersion;

    // Output results with visual separation
    core.info('╔════════════════════════════════════════');
    core.info('║ WordPress Plugin Version Bumper Results');
    core.info('╠════════════════════════════════════════');
    core.info(`║ Old Version: ${oldVersion}`);
    core.info(`║ New Version: ${newVersion}`);
    core.info(`║ Version Bumped: ${isVersionBumped}`);
    core.info('╚════════════════════════════════════════');

    core.setOutput('old_version', oldVersion);
    core.setOutput('new_version', newVersion);
    core.setOutput('is_version_bumped', isVersionBumped);

    if (isVersionBumped) {
      core.notice(`Version bumped from ${oldVersion} to ${newVersion}`);
    } else {
      core.notice('No version change needed');
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

module.exports = {
  bumpVersion,
  getCurrentVersion,
  parseVersion,
};

if (require.main === module) {
  run();
}
