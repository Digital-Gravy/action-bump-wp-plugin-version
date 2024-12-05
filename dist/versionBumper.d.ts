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
export declare const BumpTypes: {
    readonly MAJOR: "major";
    readonly MINOR: "minor";
    readonly PATCH: "patch";
    readonly BUILD: "build";
    readonly STABLE: "stable";
    readonly NONE: "none";
};
/**
 * Type definition for valid bump types
 */
export type BumpType = (typeof BumpTypes)[keyof typeof BumpTypes];
/**
 * Valid prerelease types as a const object
 */
export declare const PrereleaseTypes: {
    readonly NONE: "none";
    readonly DEV: "dev";
    readonly ALPHA: "alpha";
    readonly BETA: "beta";
    readonly RC: "rc";
};
/**
 * Type definition for valid prerelease types
 */
export type PrereleaseType = (typeof PrereleaseTypes)[keyof typeof PrereleaseTypes];
/**
 * Bumps the version number in a WordPress plugin file
 *
 * @param filePath - Path to the WordPress plugin file
 * @param bumpType - Type of version bump to perform
 * @param prereleaseType - Type of prerelease to set/bump
 * @returns Object containing old version, new version, and whether version was bumped
 */
export declare function bumpVersion(filePath: string, bumpType: BumpType, prereleaseType: PrereleaseType): VersionResult;
