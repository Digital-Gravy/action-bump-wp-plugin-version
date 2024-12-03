import { bumpVersion, VersionResult } from '../src/versionBumper';

describe('bumpVersion', () => {
  it('should return a valid VersionResult object', () => {
    const result: VersionResult = bumpVersion(
      'test/fixtures/test-plugin.php',
      'patch',
      'none'
    );

    expect(result).toEqual({
      oldVersion: expect.any(String),
      newVersion: expect.any(String),
      isVersionBumped: expect.any(Boolean)
    });
  });
});
