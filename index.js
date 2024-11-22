const core = require('@actions/core');
const fs = require('fs');
const path = require('path');

function getCurrentVersion(pluginDir, mainFile) {
  const filePath = path.join(pluginDir, mainFile);

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
    prerelease: match[4] || null,
    prereleaseNum: match[5] ? parseInt(match[5]) : null,
    build: match[6] || null,
  };
}

function getPrereleaseOrder(type) {
  const order = { dev: 0, alpha: 1, beta: 2, rc: 3 };
  return order[type] || -1;
}

function generateTimestamp() {
  return new Date()
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, '')
    .replace('T', '');
}

function bumpVersion(currentVersion, bumpType, prereleaseType) {
  const parsed = parseVersion(currentVersion);
  if (!parsed) throw new Error('Invalid version format');

  const newVersion = { ...parsed };

  if (bumpType === 'none' && prereleaseType !== 'none') {
    if (parsed.prerelease === prereleaseType) {
      newVersion.prereleaseNum = parsed.prereleaseNum + 1;
      return formatVersion(newVersion);
    }
    if (
      parsed.prerelease &&
      getPrereleaseOrder(prereleaseType) <= getPrereleaseOrder(parsed.prerelease)
    ) {
      throw new Error('Cannot downgrade prerelease type');
    }
    newVersion.prereleaseNum = 1;
    newVersion.prerelease = prereleaseType;
    return formatVersion(newVersion);
  }

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

  if (prereleaseType !== 'none' && bumpType !== 'build') {
    newVersion.prerelease = prereleaseType;
    newVersion.prereleaseNum = 1;
  } else if (bumpType !== 'build') {
    newVersion.prerelease = null;
    newVersion.prereleaseNum = null;
  }

  return formatVersion(newVersion);
}

function formatVersion(version) {
  let formatted = `${version.major}.${version.minor}.${version.patch}`;
  if (version.prerelease) {
    formatted += `-${version.prerelease}-${version.prereleaseNum}`;
  }
  if (version.build) {
    formatted += `+${version.build}`;
  }
  return formatted;
}

function run() {
  try {
    const bumpType = core.getInput('bump_type');
    const prereleaseType = core.getInput('prerelease_type');
    const pluginDir = core.getInput('plugin_dir');
    const mainFile = core.getInput('main_file');

    const oldVersion = getCurrentVersion(pluginDir, mainFile);
    const newVersion = bumpVersion(oldVersion, bumpType, prereleaseType);
    const isVersionBumped = oldVersion !== newVersion;

    core.setOutput('old_version', oldVersion);
    core.setOutput('new_version', newVersion);
    core.setOutput('is_version_bumped', isVersionBumped);
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
