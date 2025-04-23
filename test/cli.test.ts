import { validateBumpType, validatePrereleaseType } from '../src/cli';
import { BumpTypes, PrereleaseTypes } from '../src/versionBumper';
import { describe, it, expect } from '@jest/globals';

describe('CLI Validation', () => {
  describe('validateBumpType', () => {
    it('accepts valid bump types', () => {
      expect(validateBumpType('major')).toBe('major');
      expect(validateBumpType('minor')).toBe('minor');
      expect(validateBumpType('patch')).toBe('patch');
      expect(validateBumpType('build')).toBe('build');
      expect(validateBumpType('stable')).toBe('stable');
      expect(validateBumpType('none')).toBe('none');
    });

    it('throws error for invalid bump type', () => {
      expect(() => validateBumpType('invalid')).toThrow(
        `Invalid bump type: invalid. Valid types are: ${Object.values(BumpTypes).join(', ')}`
      );
    });
  });

  describe('validatePrereleaseType', () => {
    it('accepts valid prerelease types', () => {
      expect(validatePrereleaseType('none')).toBe('none');
      expect(validatePrereleaseType('dev')).toBe('dev');
      expect(validatePrereleaseType('alpha')).toBe('alpha');
      expect(validatePrereleaseType('beta')).toBe('beta');
      expect(validatePrereleaseType('rc')).toBe('rc');
    });

    it('throws error for invalid prerelease type', () => {
      expect(() => validatePrereleaseType('invalid')).toThrow(
        `Invalid prerelease type: invalid. Valid types are: ${Object.values(PrereleaseTypes).join(', ')}`
      );
    });
  });
});
