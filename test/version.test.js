const { bumpVersion, parseVersion, getCurrentVersion } = require('../index');
const fs = require('fs');
const path = require('path');

jest.mock('fs');
jest.mock('path');

describe('Version Bumper', () => {
  const timestamp = '20240101120000';

  beforeEach(() => {
    // Mock Date for consistent timestamps in tests
    const mockDate = new Date('2024-01-01T12:00:00Z');
    global.Date = class extends Date {
      constructor() {
        return mockDate;
      }
    };

    // Reset all mocks before each test
    jest.clearAllMocks();
    path.join.mockImplementation((...parts) => parts.join('/'));
  });

  describe('parseVersion', () => {
    it('should parse simple version', () => {
      expect(parseVersion('1.2.3')).toEqual({
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: null,
        prereleaseNum: null,
        build: null,
      });
    });

    it('should parse version with prerelease', () => {
      expect(parseVersion('1.2.3-alpha-1')).toEqual({
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: 'alpha',
        prereleaseNum: 1,
        build: null,
      });
    });

    it('should parse version with valid build number', () => {
      expect(parseVersion('1.2.3+20240101120000')).toEqual({
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: null,
        prereleaseNum: null,
        build: '20240101120000',
      });
    });

    it('should parse version with prerelease and valid build', () => {
      expect(parseVersion('1.2.3-alpha-1+20240101120000')).toEqual({
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: 'alpha',
        prereleaseNum: 1,
        build: '20240101120000',
      });
    });

    it('should return null for invalid build format', () => {
      expect(parseVersion('1.2.3+build.123')).toBeNull();
      expect(parseVersion('1.2.3+123')).toBeNull();
      expect(parseVersion('1.2.3+abc')).toBeNull();
      expect(parseVersion('1.2.3+2024010112000')).toBeNull(); // 13 digits
      expect(parseVersion('1.2.3+202401011200000')).toBeNull(); // 15 digits
    });

    it('should return null for invalid prerelease format', () => {
      expect(parseVersion('1.2.3-alpha')).toBeNull();
      expect(parseVersion('1.2.3-alpha-')).toBeNull();
      expect(parseVersion('1.2.3-alpha-a')).toBeNull();
      expect(parseVersion('1.2.3-123-1')).toBeNull();
      expect(parseVersion('1.2.3-ALPHA-1')).toBeNull();
    });

    it('should return null for invalid version formats', () => {
      expect(parseVersion('1.2')).toBeNull();
      expect(parseVersion('1.2.3.4')).toBeNull();
      expect(parseVersion('1.2.a')).toBeNull();
      expect(parseVersion('latest')).toBeNull();
      expect(parseVersion('')).toBeNull();
    });
  });

  describe('Version Bumping', () => {
    it('should bump patch version', () => {
      expect(bumpVersion('1.2.3', 'patch', 'none')).toBe('1.2.4');
    });

    it('should bump minor version', () => {
      expect(bumpVersion('1.2.3', 'minor', 'none')).toBe('1.3.0');
    });

    it('should bump major version', () => {
      expect(bumpVersion('1.2.3', 'major', 'none')).toBe('2.0.0');
    });

    it('should add alpha to patch version', () => {
      expect(bumpVersion('1.2.3', 'patch', 'alpha')).toBe('1.2.4-alpha-1');
    });

    it('should bump alpha version', () => {
      expect(bumpVersion('1.2.3-alpha-1', 'none', 'alpha')).toBe('1.2.3-alpha-2');
    });

    it('should bump dev version', () => {
      expect(bumpVersion('1.2.3-dev-1', 'none', 'dev')).toBe('1.2.3-dev-2');
    });

    it('should bump beta version', () => {
      expect(bumpVersion('1.2.3-beta-1', 'none', 'beta')).toBe('1.2.3-beta-2');
    });

    it('should bump rc version', () => {
      expect(bumpVersion('1.2.3-rc-1', 'none', 'rc')).toBe('1.2.3-rc-2');
    });

    it('should add build number', () => {
      expect(bumpVersion('1.2.3', 'build', 'none')).toBe(`1.2.3+${timestamp}`);
    });

    it('should add build number to prerelease version', () => {
      expect(bumpVersion('1.2.3-alpha-1', 'build', 'none')).toBe(`1.2.3-alpha-1+${timestamp}`);
    });

    it('should handle version 0.0.0', () => {
      expect(bumpVersion('0.0.0', 'patch', 'none')).toBe('0.0.1');
      expect(bumpVersion('0.0.0', 'minor', 'none')).toBe('0.1.0');
      expect(bumpVersion('0.0.0', 'major', 'none')).toBe('1.0.0');
    });

    it('should handle version 9.9.9', () => {
      expect(bumpVersion('9.9.9', 'patch', 'none')).toBe('9.9.10');
      expect(bumpVersion('9.9.9', 'minor', 'none')).toBe('9.10.0');
      expect(bumpVersion('9.9.9', 'major', 'none')).toBe('10.0.0');
    });

    it('should throw error for invalid version format', () => {
      expect(() => bumpVersion('invalid', 'patch', 'none')).toThrow('Invalid version format');
      expect(() => bumpVersion('1.2', 'patch', 'none')).toThrow('Invalid version format');
    });

    it('should handle prerelease progression', () => {
      expect(bumpVersion('1.2.3-dev-2', 'none', 'alpha')).toBe('1.2.3-alpha-1');
      expect(bumpVersion('1.2.3-alpha-2', 'none', 'beta')).toBe('1.2.3-beta-1');
      expect(bumpVersion('1.2.3-beta-2', 'none', 'rc')).toBe('1.2.3-rc-1');
    });

    it('should prevent prerelease downgrade', () => {
      expect(() => bumpVersion('1.2.3-beta-1', 'none', 'alpha')).toThrow(
        'Cannot downgrade prerelease type'
      );
      expect(() => bumpVersion('1.2.3-rc-1', 'none', 'beta')).toThrow(
        'Cannot downgrade prerelease type'
      );
      expect(() => bumpVersion('1.2.3-alpha-1', 'none', 'dev')).toThrow(
        'Cannot downgrade prerelease type'
      );
    });
  });

  describe('getCurrentVersion', () => {
    it('should read valid version from plugin file', () => {
      fs.readFileSync.mockReturnValue(`<?php
        /**
         * Plugin Name: Test Plugin
         * Version: 1.2.3
         */`);

      expect(getCurrentVersion('plugin-dir', 'plugin.php')).toBe('1.2.3');
      expect(fs.readFileSync).toHaveBeenCalledWith('plugin-dir/plugin.php', 'utf8');
    });

    it('should throw error when file does not exist', () => {
      fs.readFileSync.mockImplementation(() => {
        const error = new Error('File not found');
        error.code = 'ENOENT';
        throw error;
      });

      expect(() => getCurrentVersion('plugin-dir', 'plugin.php')).toThrow(
        'Plugin file not found at: plugin-dir/plugin.php'
      );
    });

    it('should throw error when Version header is missing', () => {
      fs.readFileSync.mockReturnValue(`<?php
        /**
         * Plugin Name: Test Plugin
         */`);

      expect(() => getCurrentVersion('plugin-dir', 'plugin.php')).toThrow(
        'Version header not found in plugin file'
      );
    });

    it('should throw error when version format is invalid', () => {
      fs.readFileSync.mockReturnValue(`<?php
        /**
         * Plugin Name: Test Plugin
         * Version: invalid-version
         */`);

      expect(() => getCurrentVersion('plugin-dir', 'plugin.php')).toThrow(
        'Invalid version format found in plugin file: "invalid-version"'
      );
    });

    it('should throw error when Version header is empty', () => {
      fs.readFileSync.mockReturnValue(`<?php
        /**
         * Plugin Name: Test Plugin
         * Version:
         */`);

      expect(() => getCurrentVersion('plugin-dir', 'plugin.php')).toThrow(
        'Version header not found in plugin file'
      );
    });

    it('should handle other file read errors', () => {
      fs.readFileSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      expect(() => getCurrentVersion('plugin-dir', 'plugin.php')).toThrow('Permission denied');
    });

    it('should handle version with valid prerelease', () => {
      fs.readFileSync.mockReturnValue(`<?php
        /**
         * Plugin Name: Test Plugin
         * Version: 1.2.3-beta-1
         */`);

      expect(getCurrentVersion('plugin-dir', 'plugin.php')).toBe('1.2.3-beta-1');
    });

    it('should throw error for invalid prerelease format', () => {
      fs.readFileSync.mockReturnValue(`<?php
        /**
         * Plugin Name: Test Plugin
         * Version: 1.2.3-beta
         */`);

      expect(() => getCurrentVersion('plugin-dir', 'plugin.php')).toThrow(
        'Invalid version format found in plugin file: "1.2.3-beta"'
      );
    });

    it('should handle version with valid build number', () => {
      fs.readFileSync.mockReturnValue(`<?php
        /**
         * Plugin Name: Test Plugin
         * Version: 1.2.3+20240101120000
         */`);

      expect(getCurrentVersion('plugin-dir', 'plugin.php')).toBe('1.2.3+20240101120000');
    });

    it('should handle version with both prerelease and build', () => {
      fs.readFileSync.mockReturnValue(`<?php
        /**
         * Plugin Name: Test Plugin
         * Version: 1.2.3-alpha-1+20240101120000
         */`);

      expect(getCurrentVersion('plugin-dir', 'plugin.php')).toBe('1.2.3-alpha-1+20240101120000');
    });

    it('should throw error for malformed version with build', () => {
      fs.readFileSync.mockReturnValue(`<?php
        /**
         * Plugin Name: Test Plugin
         * Version: 1.2.3+build.123
         */`);

      expect(() => getCurrentVersion('plugin-dir', 'plugin.php')).toThrow(
        'Invalid version format found in plugin file: "1.2.3+build.123"'
      );
    });

    it('should handle extreme whitespace in Version header', () => {
      fs.readFileSync.mockReturnValue(`<?php
        /**
         * Plugin Name: Test Plugin
         * Version:       1.2.3
         */`);

      expect(getCurrentVersion('plugin-dir', 'plugin.php')).toBe('1.2.3');
    });
  });
});
