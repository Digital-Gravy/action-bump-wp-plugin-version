## Major Version Tag (v1)

```bash
# Create and push a new major version tag
git tag -fa v1 -m "Update v1 tag to latest version"
git push origin v1 --force
```

## Specific Version Tag (v1.0.0)

```bash
# Create and push a specific version
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0

# Also update the major version tag
git tag -fa v1 -m "Update v1 tag to latest version"
git push origin v1 --force
```

## Release Process

1. Make your changes and commit them
2. Create a specific version tag (e.g., v1.0.0):
   ```bash
   git tag -a v1.0.0 -m "Release version 1.0.0"
   ```
3. Update the major version tag (v1):
   ```bash
   git tag -fa v1 -m "Update v1 tag to latest version"
   ```
4. Push both tags:
   ```bash
   git push origin v1.0.0
   git push origin v1 --force
   ```
5. Create a GitHub release (optional but recommended):
   - Go to GitHub > Releases > New
   - Select your version tag
   - Add release notes
   - Publish the release

## Version Update Scenarios

1. For patch updates (bug fixes):

   ```bash
   git tag -a v1.0.1 -m "Release version 1.0.1"
   git tag -fa v1 -m "Update v1 tag to latest version"
   git push origin v1.0.1
   git push origin v1 --force
   ```

2. For minor updates (new features):

   ```bash
   git tag -a v1.1.0 -m "Release version 1.1.0"
   git tag -fa v1 -m "Update v1 tag to latest version"
   git push origin v1.1.0
   git push origin v1 --force
   ```

3. For major updates (breaking changes):
   ```bash
   git tag -a v2.0.0 -m "Release version 2.0.0"
   git tag -fa v2 -m "Create v2 major version tag"
   git push origin v2.0.0
   git push origin v2 --force
   ```

## Impact on Users

- Users referencing `@v1` will automatically get the latest v1.x.x release
- Users referencing `@v1.0` will get the latest patch in the 1.0.x series
- Users referencing `@v1.0.0` will stay on that specific version
- For breaking changes, create a new major version tag (v2) and document the migration process
