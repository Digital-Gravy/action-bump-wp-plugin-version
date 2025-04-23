import {
  bumpVersion,
  BumpType,
  PrereleaseType,
  BumpTypes,
  PrereleaseTypes,
  FileSystem,
} from '../src/versionBumper';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

let mockFileSystem: FileSystem;
let writtenFiles: Record<string, string>;

beforeEach(() => {
  writtenFiles = {};
  const readFileSyncMock = jest.fn((path: string): string => {
    if (path.includes('invalid')) {
      return `<?php
/**
 * Plugin Name: Test Plugin
 * Version: not.valid.semver
 */`;
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

describe('Version Bumping', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('is unchanged if bump type is invalid', () => {
    const filePath = 'test-plugin.php';
    const bumpType = 'invalid' as BumpType;
    const prereleaseType = PrereleaseTypes.NONE;

    expect(() =>
      bumpVersion(filePath, bumpType, prereleaseType, undefined, mockFileSystem)
    ).toThrow('Invalid bump type: invalid');
  });

  it('is unchanged if prerelease type is invalid', () => {
    const filePath = 'test-plugin.php';
    const bumpType = BumpTypes.PATCH;
    const prereleaseType = 'invalid' as PrereleaseType;

    expect(() =>
      bumpVersion(filePath, bumpType, prereleaseType, undefined, mockFileSystem)
    ).toThrow('Invalid prerelease type: invalid');
  });

  it('is unchanged if detected version is not valid', () => {
    const mockPluginWithInvalidVersion = `<?php
/**
 * Plugin Name: Test Plugin
 * Version: not.valid.semver
 * Description: A test plugin
 */`;

    (mockFileSystem.readFileSync as jest.Mock).mockReturnValue(mockPluginWithInvalidVersion);
    const filePath = 'test-plugin.php';
    const bumpType = BumpTypes.PATCH;
    const prereleaseType = PrereleaseTypes.NONE;

    expect(() =>
      bumpVersion(filePath, bumpType, prereleaseType, undefined, mockFileSystem)
    ).toThrow('Invalid version format');
  });

  it('increments patch version, leaves minor and major unchanged when doing patch bump', () => {
    const mockPluginWithVersion = `<?php
/**
 * Plugin Name: Test Plugin
 * Version: 1.2.3
 * Description: A test plugin
 */`;
    (mockFileSystem.readFileSync as jest.Mock).mockReturnValue(mockPluginWithVersion);
    const result = bumpVersion(
      'test-plugin.php',
      BumpTypes.PATCH,
      PrereleaseTypes.NONE,
      undefined,
      mockFileSystem
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
    (mockFileSystem.readFileSync as jest.Mock).mockReturnValue(mockPluginWithVersion);
    const result = bumpVersion(
      'test-plugin.php',
      BumpTypes.MINOR,
      PrereleaseTypes.NONE,
      undefined,
      mockFileSystem
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
    (mockFileSystem.readFileSync as jest.Mock).mockReturnValue(mockPluginWithVersion);
    const result = bumpVersion(
      'test-plugin.php',
      BumpTypes.MAJOR,
      PrereleaseTypes.NONE,
      undefined,
      mockFileSystem
    );

    expect(result.newVersion).toBe('2.0.0');
  });

  it('appends prerelease suffix -1 to version when doing prerelease bump on non prerelease version', () => {
    const mockPluginWithVersion = `<?php
/**
 * Plugin Name: Test Plugin
 * Version: 1.2.3
 */`;
    (mockFileSystem.readFileSync as jest.Mock).mockReturnValue(mockPluginWithVersion);
    const result = bumpVersion(
      'test-plugin.php',
      BumpTypes.NONE,
      PrereleaseTypes.ALPHA,
      undefined,
      mockFileSystem
    );

    expect(result.newVersion).toBe('1.2.3-alpha-1');
  });

  it('increments prerelease number when doing prerelease bump on existing prerelease version', () => {
    const mockPluginWithVersion = `<?php
/**
 * Plugin Name: Test Plugin
 * Version: 1.2.3-alpha-1
 */`;
    (mockFileSystem.readFileSync as jest.Mock).mockReturnValue(mockPluginWithVersion);
    const result = bumpVersion(
      'test-plugin.php',
      BumpTypes.NONE,
      PrereleaseTypes.ALPHA,
      undefined,
      mockFileSystem
    );

    expect(result.newVersion).toBe('1.2.3-alpha-2');
  });

  it('upgrades prerelease type and starts from 1 when jumping from one prerelease type to another', () => {
    const mockPluginWithVersion = `<?php
/**
 * Plugin Name: Test Plugin
 * Version: 1.2.3-alpha-3
 */`;
    (mockFileSystem.readFileSync as jest.Mock).mockReturnValue(mockPluginWithVersion);
    const result = bumpVersion(
      'test-plugin.php',
      BumpTypes.NONE,
      PrereleaseTypes.BETA,
      undefined,
      mockFileSystem
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
    (mockFileSystem.readFileSync as jest.Mock).mockReturnValue(mockPluginWithVersion);
    const result = bumpVersion(
      'test-plugin.php',
      BumpTypes.BUILD,
      PrereleaseTypes.NONE,
      undefined,
      mockFileSystem
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
    (mockFileSystem.readFileSync as jest.Mock).mockReturnValue(mockPluginWithVersion);
    const result = bumpVersion(
      'test-plugin.php',
      BumpTypes.BUILD,
      PrereleaseTypes.ALPHA,
      undefined,
      mockFileSystem
    );

    expect(result.newVersion).toBe('1.2.3-alpha-1+20241205120000');
  });

  it('removes prerelease and timestamp when doing a stable bump', () => {
    const mockPluginWithVersion = `<?php
/**
 * Plugin Name: Test Plugin
 * Version: 1.2.3-alpha-1+20241205120000
 */`;
    (mockFileSystem.readFileSync as jest.Mock).mockReturnValue(mockPluginWithVersion);
    const result = bumpVersion(
      'test-plugin.php',
      BumpTypes.STABLE,
      PrereleaseTypes.NONE,
      undefined,
      mockFileSystem
    );

    expect(result.newVersion).toBe('1.2.3');
  });

  it('prevents prerelease downgrade', () => {
    const mockPluginWithVersion = `<?php
/**
 * Plugin Name: Test Plugin
 * Version: 1.2.3-beta-1
 */`;
    (mockFileSystem.readFileSync as jest.Mock).mockReturnValue(mockPluginWithVersion);
    expect(() =>
      bumpVersion(
        'test-plugin.php',
        BumpTypes.NONE,
        PrereleaseTypes.ALPHA,
        undefined,
        mockFileSystem
      )
    ).toThrow('Prerelease downgrade is not allowed');
  });
});
