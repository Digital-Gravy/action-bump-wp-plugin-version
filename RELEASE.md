# Release Process

This document outlines the steps to build and publish a new release of this GitHub Action.

## Prerequisites

- Node.js installed (v20 recommended)
- npm installed
- Git installed
- Repository cloned locally

## Steps

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Run Tests**

   ```bash
   npm test
   ```

3. **Run Linting**

   ```bash
   npm run lint
   ```

4. **Build the Action**

   ```bash
   npm run build
   ```

   This creates a compiled version in the `dist/` directory.

5. **Commit Changes**

   ```bash
   git add dist/
   git add package.json package-lock.json
   git commit -m "Build for release"
   ```

6. **Tag and Release**

   For a new major version:

   ```bash
   # Create version tag
   git tag -a v1.0.0 -m "Release version 1.0.0"

   # Create or update major version tag
   git tag -fa v1 -m "Update v1 tag"

   # Push both tags
   git push origin v1.0.0
   git push origin v1 --force
   ```

   For a patch release:

   ```bash
   # Create version tag
   git tag -a v1.0.1 -m "Release version 1.0.1"

   # Update major version tag
   git tag -fa v1 -m "Update v1 tag"

   # Push both tags
   git push origin v1.0.1
   git push origin v1 --force
   ```

7. **Create GitHub Release**
   - Go to GitHub repository
   - Click "Releases"
   - Click "Create a new release"
   - Choose your tag
   - Add release notes
   - Publish release

## Version Tag Format

- Specific versions: `v1.0.0`, `v1.0.1`, etc.
- Major version tag: `v1`
- Pre-releases: `v1.0.0-beta.1`, `v1.0.0-alpha.1`

## Notes

- Always build and test before creating a release
- Major version tags (`v1`) should be force-pushed to point to the latest release in that major version
- Remember to update the README if there are any usage changes
- Users referencing `@v1` will automatically get the latest release in the v1.x.x series
