#!/bin/bash
# bump_version.sh

# Get current version from plugin file
version_line=$(grep -e 'Version:' "${INPUT_PLUGIN_FILE_PATH}")
current_version=$(echo $version_line | grep -oP '\d+\.\d+\.\d+(-(?:alpha|beta|rc)-\d+)?(?:\+[0-9]+)?')
echo "Current version: $current_version"

# Extract version components
if [[ $current_version =~ ^([0-9]+)\.([0-9]+)\.([0-9]+)(-([a-z]+)-([0-9]+))?(\+([0-9]+))?$ ]]; then
  major="${BASH_REMATCH[1]}"
  minor="${BASH_REMATCH[2]}"
  patch="${BASH_REMATCH[3]}"
  current_prerelease_type="${BASH_REMATCH[5]}"
  current_prerelease_num="${BASH_REMATCH[6]}"
  current_build="${BASH_REMATCH[8]}"
else
  echo "Error: Could not parse current version"
  exit 1
fi

# Convert release type to lowercase for version string
release_type=$(echo "${INPUT_RELEASE_TYPE}" | tr '[:upper:]' '[:lower:]')

# Generate timestamp for build releases
timestamp=$(date '+%Y%m%d%H%M%S')-${GITHUB_RUN_NUMBER:-0}

# Initialize new version with current base version
new_version="${major}.${minor}.${patch}"

# Handle prerelease type changes and version bumps
if [[ "${INPUT_RELEASE_TYPE}" != "Stable" ]]; then
  if [[ -n "$current_prerelease_type" ]]; then
    # Currently on a prerelease version
    if [[ "${release_type}" == "${current_prerelease_type}" ]]; then
      # Same prerelease type - just bump the prerelease number
      new_prerelease_num=$((current_prerelease_num + 1))
      new_version="${major}.${minor}.${patch}-${release_type}-${new_prerelease_num}"
    else
      # Different prerelease type - switch type and reset to 1
      new_version="${major}.${minor}.${patch}-${release_type}-1"
    fi
  else
    # Not currently on a prerelease - add prerelease info
    new_version="${major}.${minor}.${patch}-${release_type}-1"
  fi
else
  # Stable release - handle version bumps if requested
  case "${INPUT_VERSION_BUMP}" in
    "No version bump")
      # Keep current version
      ;;
    Build)
      new_version="${new_version}+${timestamp}"
      ;;
    Patch)
      new_version="$major.$minor.$((patch + 1))"
      ;;
    Minor)
      new_version="$major.$((minor + 1)).0"
      ;;
    Major)
      new_version="$((major + 1)).0.0"
      ;;
  esac
fi

# Handle build numbers for non-stable releases
if [[ "${INPUT_VERSION_BUMP}" == "Build" ]]; then
  if [[ "$new_version" =~ -([a-z]+)-([0-9]+)$ ]]; then
    # Add build number to prerelease version
    new_version="${new_version}+${timestamp}"
  else
    # Add build number to stable version
    new_version="${new_version}+${timestamp}"
  fi
fi

echo "New version: $new_version"
echo "new_version=$new_version" >> $GITHUB_OUTPUT
echo "current_version=$current_version" >> $GITHUB_OUTPUT

if [ "$new_version" != "$current_version" ]; then
  sed -i "s/^\(\s*\* Version:\s*\)[^ ].*$/\1$new_version/" "${INPUT_PLUGIN_FILE_PATH}"
  echo "Version in ${INPUT_PLUGIN_FILE_PATH} after update:"
  grep -e 'Version:' "${INPUT_PLUGIN_FILE_PATH}"
  echo "version_bumped=true" >> $GITHUB_OUTPUT
else
  echo "No version changes needed."
  echo "version_bumped=false" >> $GITHUB_OUTPUT
fi
