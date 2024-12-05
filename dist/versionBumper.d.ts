/**
 * Interface for version bump results
 */
export interface VersionResult {
    oldVersion: string;
    newVersion: string;
    isVersionBumped: boolean;
}
/**
 * Type definition for valid bump types
 */
export type BumpType = 'major' | 'minor' | 'patch' | 'build' | 'none';
/**
 * Type definition for valid prerelease types
 */
export type PrereleaseType = 'none' | 'dev' | 'alpha' | 'beta' | 'rc';
/**
 * Bumps the version number in a WordPress plugin file
 *
 * @param filePath - Path to the WordPress plugin file
 * @param bumpType - Type of version bump to perform
 * @param prereleaseType - Type of prerelease to set/bump
 * @returns Object containing old version, new version, and whether version was bumped
 */
export declare function bumpVersion(filePath: string, bumpType: BumpType, prereleaseType: PrereleaseType): VersionResult;
