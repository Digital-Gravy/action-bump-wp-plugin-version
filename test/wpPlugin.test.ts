import { bumpVersion, BumpTypes, PrereleaseTypes, FileSystem } from '../src/versionBumper';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

let mockFileSystem: FileSystem;
let writtenFiles: Record<string, string>;

beforeEach(() => {
  writtenFiles = {};
  const readFileSyncMock = jest.fn((path: string): string => {
    if (path.includes('nonexistent')) {
      throw new Error('Permission denied');
    }
    return `<?php
/**
 * Plugin Name: Test Plugin
 * Version: 1.2.3
 */`;
  });

  const writeFileSyncMock = jest.fn((path: string, data: string): void => {
    writtenFiles[path] = data;
  });

  const existsSyncMock = jest.fn((path: string): boolean => {
    return !path.includes('nonexistent');
  });

  mockFileSystem = {
    readFileSync: readFileSyncMock,
    writeFileSync: writeFileSyncMock,
    existsSync: existsSyncMock,
  } as FileSystem;
});

describe('WordPress Plugin Version', () => {
  it('is unchanged when bump type and prerelease type are none', () => {
    const mockPluginWithVersion = `<?php
/**
 * Plugin Name: Test Plugin
 * Version: 1.2.3
 */`;
    (mockFileSystem.readFileSync as jest.Mock).mockReturnValue(mockPluginWithVersion);
    const filePath = 'test-plugin.php';
    const bumpType = BumpTypes.NONE;
    const prereleaseType = PrereleaseTypes.NONE;

    const result = bumpVersion(filePath, bumpType, prereleaseType, undefined, mockFileSystem);

    expect(result.isVersionBumped).toBe(false);
    expect(result.oldVersion).toBe('1.2.3');
    expect(result.newVersion).toBe('1.2.3');
  });

  it('is unchanged if file does not exist', () => {
    (mockFileSystem.existsSync as jest.Mock).mockReturnValue(false);
    const filePath = 'path/to/nonexistent/file.php';
    const bumpType = BumpTypes.PATCH;
    const prereleaseType = PrereleaseTypes.NONE;

    expect(() =>
      bumpVersion(filePath, bumpType, prereleaseType, undefined, mockFileSystem)
    ).toThrow('File does not exist');
  });

  it('is unchanged if there was an error reading the file', () => {
    const filePath = 'path/to/nonexistent/file.php';
    const bumpType = BumpTypes.PATCH;
    const prereleaseType = PrereleaseTypes.NONE;

    expect(() =>
      bumpVersion(filePath, bumpType, prereleaseType, undefined, mockFileSystem)
    ).toThrow('File does not exist: path/to/nonexistent/file.php');
  });

  it('is unchanged if file does not contain a version', () => {
    const mockPluginWithoutVersion = `<?php
/**
 * Plugin Name: Test Plugin
 * Description: A test plugin
 */`;
    (mockFileSystem.readFileSync as jest.Mock).mockReturnValue(mockPluginWithoutVersion);
    const filePath = 'test-plugin.php';
    const bumpType = BumpTypes.PATCH;
    const prereleaseType = PrereleaseTypes.NONE;

    expect(() =>
      bumpVersion(filePath, bumpType, prereleaseType, undefined, mockFileSystem)
    ).toThrow('No version found in the file');
  });

  it('correctly extracts version from plugin header', () => {
    const mockPluginWithVersion = `<?php
/**
 * Plugin Name: Test Plugin
 * Version: 1.2.3
 * Description: A test plugin
 */`;

    (mockFileSystem.readFileSync as jest.Mock).mockReturnValue(mockPluginWithVersion);
    const result = bumpVersion(
      'test.php',
      BumpTypes.PATCH,
      PrereleaseTypes.NONE,
      undefined,
      mockFileSystem
    );

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

    (mockFileSystem.readFileSync as jest.Mock).mockReturnValue(mockPluginWithMultipleVersions);
    const result = bumpVersion(
      'test.php',
      BumpTypes.PATCH,
      PrereleaseTypes.NONE,
      undefined,
      mockFileSystem
    );

    expect(result.oldVersion).toBe('1.2.3');
  });

  it('is unchanged when no bump happens', () => {
    const mockPluginWithVersion = `<?php
/**
 * Plugin Name: Test Plugin
 * Version: 1.2.3
 */`;
    (mockFileSystem.readFileSync as jest.Mock).mockReturnValue(mockPluginWithVersion);
    bumpVersion('test.php', BumpTypes.NONE, PrereleaseTypes.NONE, undefined, mockFileSystem);

    expect(mockFileSystem.writeFileSync).not.toHaveBeenCalled();
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
    (mockFileSystem.readFileSync as jest.Mock).mockImplementation(() => mockedPluginWithOldVersion);
    bumpVersion(
      'plugin-dir/plugin.php',
      BumpTypes.PATCH,
      PrereleaseTypes.NONE,
      undefined,
      mockFileSystem
    );
    expect(mockFileSystem.writeFileSync).toHaveBeenCalledWith(
      'plugin-dir/plugin.php',
      mockedPluginWithNewVersion
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

    (mockFileSystem.readFileSync as jest.Mock).mockReturnValue(mockPluginWithMultipleVersions);
    bumpVersion('test.php', BumpTypes.PATCH, PrereleaseTypes.NONE, undefined, mockFileSystem);

    const writtenContent = writtenFiles['test.php'];
    expect(writtenContent).toContain('Version: 2.0.0');
    expect(writtenContent).toContain('Version: 3.4.5-alpha-1-20241205120000');
  });

  it('correctly extracts version with extra whitespace formatting', () => {
    const mockPluginWithFormattedVersion = `<?php
/**
 * Plugin Name:       Test Plugin
 * Version:           1.2.3
 * Description:       A test plugin with extra formatting
 */`;

    (mockFileSystem.readFileSync as jest.Mock).mockReturnValue(mockPluginWithFormattedVersion);
    const result = bumpVersion(
      'test.php',
      BumpTypes.PATCH,
      PrereleaseTypes.NONE,
      undefined,
      mockFileSystem
    );

    expect(result.oldVersion).toBe('1.2.3');
    expect(result.newVersion).toBe('1.2.4');
  });

  it('correctly extracts version with extra comment block', () => {
    const mockPluginWithCommentBlock = `<?php
/**
 * Automatic.css Main file.
 *
 * @package Automatic_CSS
 */

/**
 * Plugin Name: Test Plugin
 * Version: 1.2.3
 */
`;
    (mockFileSystem.readFileSync as jest.Mock).mockReturnValue(mockPluginWithCommentBlock);
    const result = bumpVersion(
      'test.php',
      BumpTypes.PATCH,
      PrereleaseTypes.NONE,
      undefined,
      mockFileSystem
    );

    expect(result.oldVersion).toBe('1.2.3');
  });
});
