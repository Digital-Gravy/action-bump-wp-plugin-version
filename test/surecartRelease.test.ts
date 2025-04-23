import { bumpVersion, BumpTypes, PrereleaseTypes, FileSystem } from '../src/versionBumper';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

describe('SureCart release file', () => {
  let mockFileSystem: FileSystem;
  let writtenFiles: Record<string, string>;

  beforeEach(() => {
    writtenFiles = {};
    const readFileSyncMock = jest.fn((_path: string): string => {
      if (_path.includes('surecart-release.json')) {
        return '{"name": "Test Plugin", "slug": "test-plugin", "version": "1.2.3"}';
      }
      return '<?php\n/**\n * Plugin Name: Test Plugin\n * Version: 1.2.3\n */';
    });

    const writeFileSyncMock = jest.fn((_path: string, _data: string): void => {
      writtenFiles[_path] = _data;
    });

    const existsSyncMock = jest.fn().mockReturnValue(true);

    mockFileSystem = {
      readFileSync: readFileSyncMock,
      writeFileSync: writeFileSyncMock,
      existsSync: existsSyncMock,
    } as FileSystem;
  });

  it('updates version in SureCart release file when provided and version is bumped', () => {
    bumpVersion(
      'test.php',
      BumpTypes.PATCH,
      PrereleaseTypes.NONE,
      'surecart-release.json',
      mockFileSystem
    );

    expect(writtenFiles['surecart-release.json']).toContain('"version": "1.2.4"');
  });

  it('does not update SureCart release file when version is not bumped', () => {
    bumpVersion(
      'test.php',
      BumpTypes.NONE,
      PrereleaseTypes.NONE,
      'surecart-release.json',
      mockFileSystem
    );

    expect(writtenFiles['surecart-release.json']).toBeUndefined();
  });

  it('throws error when SureCart release file does not exist', () => {
    const existsSyncMock = jest.fn((_path: string): boolean => {
      if (_path.includes('surecart-release.json')) {
        return false;
      }
      return true;
    });
    mockFileSystem.existsSync = existsSyncMock;

    expect(() =>
      bumpVersion(
        'test.php',
        BumpTypes.PATCH,
        PrereleaseTypes.NONE,
        'surecart-release.json',
        mockFileSystem
      )
    ).toThrow('SureCart release file does not exist');
  });

  it('throws error when SureCart release file contains invalid JSON', () => {
    const readFileSyncMock = jest.fn((_path: string): string => {
      if (_path.includes('surecart-release.json')) {
        return '{"name": "Test Plugin", "slug": "test-plugin", "version": "1.2.3" invalid json}';
      }
      return '<?php\n/**\n * Plugin Name: Test Plugin\n * Version: 1.2.3\n */';
    });
    mockFileSystem.readFileSync = readFileSyncMock;

    expect(() =>
      bumpVersion(
        'test.php',
        BumpTypes.PATCH,
        PrereleaseTypes.NONE,
        'surecart-release.json',
        mockFileSystem
      )
    ).toThrow('Invalid JSON in SureCart release file');
  });

  it('throws error when SureCart release file has invalid format', () => {
    const readFileSyncMock = jest.fn((_path: string): string => {
      if (_path.includes('surecart-release.json')) {
        return '"not an object"';
      }
      return '<?php\n/**\n * Plugin Name: Test Plugin\n * Version: 1.2.3\n */';
    });
    mockFileSystem.readFileSync = readFileSyncMock;

    expect(() =>
      bumpVersion(
        'test.php',
        BumpTypes.PATCH,
        PrereleaseTypes.NONE,
        'surecart-release.json',
        mockFileSystem
      )
    ).toThrow('Invalid SureCart release file format');
  });
});
