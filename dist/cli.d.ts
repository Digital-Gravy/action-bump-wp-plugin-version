import { BumpType, PrereleaseType } from './versionBumper';
declare function validateBumpType(type: string): BumpType;
declare function validatePrereleaseType(type: string): PrereleaseType;
declare function main(): void;
export { validateBumpType, validatePrereleaseType, main };
