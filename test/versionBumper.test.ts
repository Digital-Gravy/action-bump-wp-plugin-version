import {
  bumpVersion,
  BumpType,
  PrereleaseType,
  BumpTypes,
  PrereleaseTypes,
} from '../src/versionBumper';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import fs from 'fs';

jest.mock('fs');

describe('Version file', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fs.existsSync as jest.Mock).mockReturnValue(true);
  });

  it('is unchanged when bump type and prerelease type are none', () => {
    const mockPluginWithVersion = `<?php
/**
 * Plugin Name: Test Plugin
 * Version: 1.2.3
 */`;
    (fs.readFileSync as jest.Mock).mockReturnValue(mockPluginWithVersion);
    const filePath = 'test/fixtures/test-plugin.php';
    const bumpType = BumpTypes.NONE;
    const prereleaseType = PrereleaseTypes.NONE;

    const result = bumpVersion(filePath, bumpType, prereleaseType);

    expect(result.isVersionBumped).toBe(false);
    expect(result.oldVersion).toBe('1.2.3');
    expect(result.newVersion).toBe('1.2.3');
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

  it('is unchanged if file does not exist', () => {
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    const filePath = 'path/to/nonexistent/file.php';
    const bumpType = BumpTypes.PATCH;
    const prereleaseType = PrereleaseTypes.NONE;

    expect(() => bumpVersion(filePath, bumpType, prereleaseType)).toThrow('File does not exist');
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

  it('is unchanged if file does not contain a version', () => {
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

  it('is unchanged if detected version is not valid', () => {
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

  it('correctly extracts version from plugin header', () => {
    const mockPluginWithVersion = `<?php
/**
 * Plugin Name: Test Plugin
 * Version: 1.2.3
 * Description: A test plugin
 */`;

    (fs.readFileSync as jest.Mock).mockReturnValue(mockPluginWithVersion);
    const result = bumpVersion('test.php', BumpTypes.PATCH, PrereleaseTypes.NONE);

    expect(result.oldVersion).toBe('1.2.3');
  });

  it('ignores version strings outside of plugin header', () => {
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

  it('is unchanged when no bump happens', () => {
    const mockPluginWithVersion = `<?php
/**
 * Plugin Name: Test Plugin
 * Version: 1.2.3
 */`;
    (fs.readFileSync as jest.Mock).mockReturnValue(mockPluginWithVersion);
    bumpVersion('test.php', BumpTypes.NONE, PrereleaseTypes.NONE);

    expect(fs.writeFileSync).not.toHaveBeenCalled();
  });

  it('writes the new version to the file when a bump happens', () => {
    const mockedPluginWithOldVersion = `<?php
        /**
         * Plugin Name: Test Plugin
         * Version: 1.2.3
         */`;
    const mockedPluginWithNewVersion = `<?php
        /**
         * Plugin Name: Test Plugin
         * Version: 1.2.4
         */`;
    (fs.readFileSync as jest.Mock).mockImplementation(() => mockedPluginWithOldVersion);
    bumpVersion('plugin-dir/plugin.php', BumpTypes.PATCH, PrereleaseTypes.NONE);
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      'plugin-dir/plugin.php',
      mockedPluginWithNewVersion,
      'utf8'
    );
  });

  it('does not overwrite version strings outside of plugin header', () => {
    const mockPluginWithMultipleVersions = `<?php
/**
 * Plugin Name: Test Plugin
 * Version: 1.2.3
 */

// Version: 2.0.0 - this should be ignored
$version = 'Version: 3.4.5-alpha-1-20241205120000'; // this should also be ignored
`;

    (fs.readFileSync as jest.Mock).mockReturnValue(mockPluginWithMultipleVersions);
    bumpVersion('test.php', BumpTypes.PATCH, PrereleaseTypes.NONE);

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      'test.php',
      expect.stringContaining('Version: 2.0.0'),
      'utf8'
    );
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      'test.php',
      expect.stringContaining('Version: 3.4.5-alpha-1-20241205120000'),
      'utf8'
    );
  });

  it('correctly extracts version with extra whitespace formatting', () => {
    const mockPluginWithFormattedVersion = `<?php
/**
 * Plugin Name:       Test Plugin
 * Version:           1.2.3
 * Description:       A test plugin with extra formatting
 */`;

    (fs.readFileSync as jest.Mock).mockReturnValue(mockPluginWithFormattedVersion);
    const result = bumpVersion('test.php', BumpTypes.PATCH, PrereleaseTypes.NONE);

    expect(result.oldVersion).toBe('1.2.3');
    expect(result.newVersion).toBe('1.2.4');
  });
});

describe('Version bumping', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('increments patch version, leaves minor and major unchanged when doing patch bump', () => {
    const mockPluginWithVersion = `<?php
/**
 * Plugin Name: Test Plugin
 * Version: 1.2.3
 * Description: A test plugin
 */`;
    (fs.readFileSync as jest.Mock).mockReturnValue(mockPluginWithVersion);
    const result = bumpVersion(
      'test/fixtures/test-plugin.php',
      BumpTypes.PATCH,
      PrereleaseTypes.NONE
    );

    expect(result.newVersion).toBe('1.2.4');
  });

  it('increments minor version, leaves major unchanged, and sets patch to 0 when doing minor bump', () => {
    const mockPluginWithVersion = `<?php
/**
 * Plugin Name: Test Plugin
 * Version: 1.2.3
 * Description: A test plugin
 */`;
    (fs.readFileSync as jest.Mock).mockReturnValue(mockPluginWithVersion);
    const result = bumpVersion(
      'test/fixtures/test-plugin.php',
      BumpTypes.MINOR,
      PrereleaseTypes.NONE
    );

    expect(result.newVersion).toBe('1.3.0');
  });

  it('increments major version, and leaves minor and patch unchanged when doing major bump', () => {
    const mockPluginWithVersion = `<?php
/**
 * Plugin Name: Test Plugin
 * Version: 1.2.3
 * Description: A test plugin
 */`;
    (fs.readFileSync as jest.Mock).mockReturnValue(mockPluginWithVersion);
    const result = bumpVersion(
      'test/fixtures/test-plugin.php',
      BumpTypes.MAJOR,
      PrereleaseTypes.NONE
    );

    expect(result.newVersion).toBe('2.0.0');
  });

  it('appends prerelease suffix -1 to version when doing prerelease bump on non prerelease version', () => {
    const mockPluginWithVersion = `<?php
/**
 * Plugin Name: Test Plugin
 * Version: 1.2.3
 */`;
    (fs.readFileSync as jest.Mock).mockReturnValue(mockPluginWithVersion);
    const result = bumpVersion(
      'test/fixtures/test-plugin.php',
      BumpTypes.NONE,
      PrereleaseTypes.ALPHA
    );

    expect(result.newVersion).toBe('1.2.3-alpha-1');
  });

  it('increments prerelease number when doing prerelease bump on existing prerelease version', () => {
    const mockPluginWithVersion = `<?php
/**
 * Plugin Name: Test Plugin
 * Version: 1.2.3-alpha-1
 */`;
    (fs.readFileSync as jest.Mock).mockReturnValue(mockPluginWithVersion);
    const result = bumpVersion(
      'test/fixtures/test-plugin.php',
      BumpTypes.NONE,
      PrereleaseTypes.ALPHA
    );

    expect(result.newVersion).toBe('1.2.3-alpha-2');
  });

  it('upgrades prerelease type and starts from 1 when jumping from one prerelease type to another', () => {
    const mockPluginWithVersion = `<?php
/**
 * Plugin Name: Test Plugin
 * Version: 1.2.3-alpha-3
 */`;
    (fs.readFileSync as jest.Mock).mockReturnValue(mockPluginWithVersion);
    const result = bumpVersion(
      'test/fixtures/test-plugin.php',
      BumpTypes.NONE,
      PrereleaseTypes.BETA
    );

    expect(result.newVersion).toBe('1.2.3-beta-1');
  });

  it('appends timestamp to version when doing build bump', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-12-05T12:00:00.000Z'));
    const mockPluginWithVersion = `<?php
/**
 * Plugin Name: Test Plugin
 * Version: 1.2.3
 */`;
    (fs.readFileSync as jest.Mock).mockReturnValue(mockPluginWithVersion);
    const result = bumpVersion(
      'test/fixtures/test-plugin.php',
      BumpTypes.BUILD,
      PrereleaseTypes.NONE
    );

    expect(result.newVersion).toBe('1.2.3+20241205120000');
  });

  it('appends both prerelease suffix and timestamp to version when doing build + prerelease bump', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-12-05T12:00:00.000Z'));
    const mockPluginWithVersion = `<?php
/**
 * Plugin Name: Test Plugin
 * Version: 1.2.3
 */`;
    (fs.readFileSync as jest.Mock).mockReturnValue(mockPluginWithVersion);
    const result = bumpVersion(
      'test/fixtures/test-plugin.php',
      BumpTypes.BUILD,
      PrereleaseTypes.ALPHA
    );

    expect(result.newVersion).toBe('1.2.3-alpha-1+20241205120000');
  });

  it('removes prerelease and timestamp when doing a stable bump', () => {
    const mockPluginWithVersion = `<?php
/**
 * Plugin Name: Test Plugin
 * Version: 1.2.3-alpha-1+20241205120000
 */`;
    (fs.readFileSync as jest.Mock).mockReturnValue(mockPluginWithVersion);
    const result = bumpVersion(
      'test/fixtures/test-plugin.php',
      BumpTypes.STABLE,
      PrereleaseTypes.NONE
    );

    expect(result.newVersion).toBe('1.2.3');
  });

  it('prevents prerelease downgrade', () => {
    const mockPluginWithVersion = `<?php
/**
 * Plugin Name: Test Plugin
 * Version: 1.2.3-beta-1
 */`;
    (fs.readFileSync as jest.Mock).mockReturnValue(mockPluginWithVersion);
    expect(() =>
      bumpVersion('test/fixtures/test-plugin.php', BumpTypes.NONE, PrereleaseTypes.ALPHA)
    ).toThrow('Prerelease downgrade is not allowed');
  });
});
