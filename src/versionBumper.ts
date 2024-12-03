import fs from 'fs';
import semver from 'semver';

/**
 * Interface for version bump results
 */
export interface VersionResult {
  oldVersion: string | null;
  newVersion: string | null;
  isVersionBumped: boolean;
}

/**
 * Valid bump types as a const object
 */
export const BumpTypes = {
  MAJOR: 'major',
  MINOR: 'minor',
  PATCH: 'patch',
  BUILD: 'build',
  NONE: 'none',
} as const;

/**
 * Type definition for valid bump types
 */
export type BumpType = (typeof BumpTypes)[keyof typeof BumpTypes];

/**
 * Valid prerelease types as a const object
 */
export const PrereleaseTypes = {
  NONE: 'none',
  DEV: 'dev',
  ALPHA: 'alpha',
  BETA: 'beta',
  RC: 'rc',
} as const;

/**
 * Type definition for valid prerelease types
 */
export type PrereleaseType = (typeof PrereleaseTypes)[keyof typeof PrereleaseTypes];

/**
 * Extracts version from WordPress plugin header
 *
 * @param content - Plugin file content
 * @returns Version string or null if not found
 */
function extractVersion(content: string): string | null {
  // Match "Version: X.Y.Z" in plugin header, ignoring whitespace
  const versionMatch = content.match(/^\s*\*\s*Version:\s*(.+)\s*$/m);
  return versionMatch ? versionMatch[1].trim() : null;
}

/**
 * Bumps the version number in a WordPress plugin file
 *
 * @param filePath - Path to the WordPress plugin file
 * @param bumpType - Type of version bump to perform
 * @param prereleaseType - Type of prerelease to set/bump
 * @returns Object containing old version, new version, and whether version was bumped
 */
export function bumpVersion(
  filePath: string,
  bumpType: BumpType,
  prereleaseType: PrereleaseType
): VersionResult {
  // No bump if bump type and prerelease type is none
  if (bumpType === BumpTypes.NONE && prereleaseType === PrereleaseTypes.NONE) {
    return {
      oldVersion: null,
      newVersion: null,
      isVersionBumped: false,
    };
  }

  // Validate inputs
  if (!Object.values(BumpTypes).includes(bumpType)) {
    throw new Error(`Invalid bump type: ${bumpType}`);
  }
  if (!Object.values(PrereleaseTypes).includes(prereleaseType)) {
    throw new Error(`Invalid prerelease type: ${prereleaseType}`);
  }

  // Read file
  let fileContents: string;
  try {
    fileContents = fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    throw error;
  }

  // Extract current version
  const currentVersion = extractVersion(fileContents);
  if (!currentVersion) {
    throw new Error('No version found in the file');
  }
  if (!semver.valid(currentVersion)) {
    throw new Error('Invalid version format');
  }

  // For now, just return the current version without bumping
  return {
    oldVersion: currentVersion,
    newVersion: currentVersion,
    isVersionBumped: false,
  };
}
