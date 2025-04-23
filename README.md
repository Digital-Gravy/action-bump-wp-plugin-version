# WordPress Plugin Version Bumper

[![Tests](https://github.com/Digital-Gravy/action-bump-wp-plugin-version/actions/workflows/test.yml/badge.svg)](https://github.com/Digital-Gravy/action-bump-wp-plugin-version/actions/workflows/test.yml)

A GitHub Action to automatically bump version numbers in WordPress plugin files. Supports semantic versioning with additional support for prerelease versions (dev/alpha/beta/rc) and build numbers.

## Version Format

Versions follow this format:

```
major.minor.patch[-prerelease-number][+YYYYMMDDHHmmss]
```

Examples:

- `1.2.3` - Standard version
- `1.2.3-alpha-1` - Alpha prerelease
- `1.2.3+20241205120000` - Version with build timestamp
- `1.2.3-beta-2+20241205120000` - Beta prerelease with build timestamp

## Usage

```yaml
- name: Bump plugin version
  uses: Digital-Gravy/action-bump-wp-plugin-version@v1
  with:
    # Type of version bump to perform (required)
    # Possible values: major, minor, patch, build, stable, none
    bump_type: 'patch'

    # Type of prerelease to set/bump (required)
    # Possible values: none, dev, alpha, beta, rc
    prerelease_type: 'none'

    # Directory containing the WordPress plugin (required)
    plugin_dir: '.'

    # Name of the main plugin file (required)
    plugin_main_file: 'my-plugin.php'

    # Path to SureCart release file relative to plugin directory (optional)
    # If provided, the version will also be updated in this file
    surecart_release_file: 'release.json'
```

## Outputs

The action provides three outputs:

- `new_version`: The new version after bumping
- `old_version`: The previous version
- `is_version_bumped`: Boolean indicating if the version changed

Example of using outputs:

```yaml
- name: Bump version
  id: bump
  uses: Digital-Gravy/action-bump-wp-plugin-version@v1
  with:
    bump_type: 'patch'
    prerelease_type: 'none'
    plugin_dir: '.'
    plugin_main_file: 'my-plugin.php'
    surecart_release_file: 'release.json'

- name: Check if version changed
  if: steps.bump.outputs.is_version_bumped == 'true'
  run: |
    echo "Version bumped from ${{ steps.bump.outputs.old_version }} to ${{ steps.bump.outputs.new_version }}"
```

## Version Bumping Rules

### Version Components

- **Major**: Backwards-incompatible changes (`1.2.3` → `2.0.0`)
- **Minor**: New features, backwards-compatible (`1.2.3` → `1.3.0`)
- **Patch**: Bug fixes, backwards-compatible (`1.2.3` → `1.2.4`)
- **Build**: Adds build timestamp (`1.2.3` → `1.2.3+20241205120000`)
- **Stable**: Removes prerelease and build numbers (`1.2.3-alpha-1+20241205120000` → `1.2.3`)

### Prerelease Progression

Prereleases follow this order: `dev` → `alpha` → `beta` → `rc`

- Cannot downgrade prerelease type (e.g., `beta` → `alpha` not allowed)
- Prerelease number increments for same type (`alpha-1` → `alpha-2`)
- New prerelease type starts at 1 (`alpha-2` → `beta-1`)

### Build Numbers

- Format: `YYYYMMDDHHmmss` timestamp
- Can be combined with any version type
- Build numbers are removed on version bumps

## Examples

| Current Version             | Bump Type | Prerelease | Result                      |
| --------------------------- | --------- | ---------- | --------------------------- |
| 1.2.3                       | patch     | none       | 1.2.4                       |
| 1.2.3                       | minor     | none       | 1.3.0                       |
| 1.2.3                       | major     | none       | 2.0.0                       |
| 1.2.3                       | patch     | alpha      | 1.2.4-alpha-1               |
| 1.2.3-alpha-1               | none      | alpha      | 1.2.3-alpha-2               |
| 1.2.3-alpha-2               | none      | beta       | 1.2.3-beta-1                |
| 1.2.3                       | build     | none       | 1.2.3+20240101120000        |
| 1.2.3-beta-1                | build     | none       | 1.2.3-beta-1+20240101120000 |
| 1.2.3-beta-1                | stable    | none       | 1.2.3                       |
| 1.2.3-beta-1+20241205120000 | stable    | none       | 1.2.3                       |

## Error Handling

The action will fail with appropriate error messages for:

- Missing or invalid plugin file
- Invalid version format in plugin file
- Attempting to downgrade prerelease type
- Invalid input parameters
- Missing SureCart release file (when specified)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## License

GPLv3 - see LICENSE file for details
