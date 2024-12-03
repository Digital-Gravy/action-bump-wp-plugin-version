import {
  bumpVersion,
  VersionResult,
  BumpType,
  PrereleaseType,
  BumpTypes,
  PrereleaseTypes,
} from '../src/versionBumper';
import fs from 'fs';

jest.mock('fs');

describe('Version file', () => {
  it('is unchanged when the bump type and prerelease type are none', () => {
    const filePath = 'test/fixtures/test-plugin.php';
    const bumpType = BumpTypes.NONE;
    const prereleaseType = PrereleaseTypes.NONE;

    const result = bumpVersion(filePath, bumpType, prereleaseType);

    expect(result.isVersionBumped).toBe(false);
  });

  it('is unchanged if bump type is invalid', () => {
    const filePath = 'test/fixtures/test-plugin.php';
    const bumpType = 'invalid' as BumpType;
    const prereleaseType = PrereleaseTypes.NONE;

    expect(() => bumpVersion(filePath, bumpType, prereleaseType)).toThrow(
      'Invalid bump type: invalid'
    );
  });

  it('is unchanged if prerelease type is invalid', () => {
    const filePath = 'test/fixtures/test-plugin.php';
    const bumpType = BumpTypes.PATCH;
    const prereleaseType = 'invalid' as PrereleaseType;

    expect(() => bumpVersion(filePath, bumpType, prereleaseType)).toThrow(
      'Invalid prerelease type: invalid'
    );
  });

  it('is unchanged if there was an error reading the file', () => {
    (fs.readFileSync as jest.Mock).mockImplementation(() => {
      throw new Error('Permission denied');
    });
    const filePath = 'path/to/nonexistent/file.php';
    const bumpType = BumpTypes.PATCH;
    const prereleaseType = PrereleaseTypes.NONE;

    expect(() => bumpVersion(filePath, bumpType, prereleaseType)).toThrow('Permission denied');
  });

  it('is unchanged if the file does not contain a version', () => {
    const mockPluginWithoutVersion = `<?php
/**
 * Plugin Name: Test Plugin
 * Description: A test plugin
 */`;
    (fs.readFileSync as jest.Mock).mockReturnValue(mockPluginWithoutVersion);
    const filePath = 'test/fixtures/test-plugin.php';
    const bumpType = BumpTypes.PATCH;
    const prereleaseType = PrereleaseTypes.NONE;

    expect(() => bumpVersion(filePath, bumpType, prereleaseType)).toThrow(
      'No version found in the file'
    );
  });

  it('is unchanged if the detected version is not a valid semver', () => {
    const mockPluginWithInvalidVersion = `<?php
/**
 * Plugin Name: Test Plugin
 * Version: not.valid.semver
 * Description: A test plugin
 */`;

    (fs.readFileSync as jest.Mock).mockReturnValue(mockPluginWithInvalidVersion);
    const filePath = 'test/fixtures/test-plugin.php';
    const bumpType = BumpTypes.PATCH;
    const prereleaseType = PrereleaseTypes.NONE;

    expect(() => bumpVersion(filePath, bumpType, prereleaseType)).toThrow('Invalid version format');
  });

  it.skip('correctly extracts version from plugin header', () => {
    const mockPluginWithVersion = `<?php
/**
 * Plugin Name: Test Plugin
 * Plugin URI: https://example.com/test-plugin
 * Version: 1.2.3
 * Description: A test plugin
 */`;

    (fs.readFileSync as jest.Mock).mockReturnValue(mockPluginWithVersion);
    const result = bumpVersion('test.php', BumpTypes.PATCH, PrereleaseTypes.NONE);

    expect(result.oldVersion).toBe('1.2.3');
  });

  it.skip('ignores version strings outside of plugin header', () => {
    const mockPluginWithMultipleVersions = `<?php
/**
 * Plugin Name: Test Plugin
 * Version: 1.2.3
 */

// Version: 2.0.0 - this should be ignored
$version = 'Version: 3.0.0'; // this should also be ignored`;

    (fs.readFileSync as jest.Mock).mockReturnValue(mockPluginWithMultipleVersions);
    const result = bumpVersion('test.php', BumpTypes.PATCH, PrereleaseTypes.NONE);

    expect(result.oldVersion).toBe('1.2.3');
  });
});
