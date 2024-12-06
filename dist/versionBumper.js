"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrereleaseTypes = exports.BumpTypes = void 0;
exports.bumpVersion = bumpVersion;
const fs_1 = __importDefault(require("fs"));
/**
 * Valid bump types as a const object
 */
exports.BumpTypes = {
    MAJOR: 'major',
    MINOR: 'minor',
    PATCH: 'patch',
    BUILD: 'build',
    STABLE: 'stable',
    NONE: 'none',
};
/**
 * Valid prerelease types as a const object
 */
exports.PrereleaseTypes = {
    NONE: 'none',
    DEV: 'dev',
    ALPHA: 'alpha',
    BETA: 'beta',
    RC: 'rc',
};
/**
 * Finds the version line in WordPress plugin header
 *
 * @param content - Plugin file content
 * @returns Object with the full match and its index position
 * @throws Error if version not found in plugin header
 */
function findVersionPosition(content) {
    // First ensure we're in the plugin header
    const headerMatch = content.match(/\/\*\*[\s\S]*?\*\//);
    if (!headerMatch) {
        throw new Error('No plugin header found in the file');
    }
    // Find version within the header bounds
    const versionRegex = /^\s*\*\s*Version:\s*(.+)\s*$/m;
    const headerContent = headerMatch[0];
    const versionMatch = headerContent.match(versionRegex);
    if (!versionMatch) {
        throw new Error('No version found in the file');
    }
    // Calculate absolute position by adding header start position
    const relativeIndex = versionMatch.index;
    const absoluteIndex = headerMatch.index + relativeIndex;
    return {
        match: versionMatch[0],
        index: absoluteIndex,
    };
}
/**
 * Extracts version from WordPress plugin header
 */
function extractVersion(content) {
    const { match } = findVersionPosition(content);
    const versionString = match.replace(/^\s*\*\s*Version:\s*/, '').trim();
    const currentVersion = parseVersion(versionString);
    return currentVersion;
}
/**
 * Parses a version string into an object
 *
 * @param version - Version string
 * @returns Version object
 */
function parseVersion(version) {
    // format: major.minor.patch[-prerelease-prereleaseNum][+build]
    // example: 1.2.3-alpha-1+20210101120000
    const regex = /^(\d+)\.(\d+)\.(\d+)(?:-([a-z]+)-(\d+))?(?:\+(\d{14}))?$/;
    const match = version.match(regex);
    if (!match)
        throw new Error('Invalid version format');
    return {
        major: parseInt(match[1]),
        minor: parseInt(match[2]),
        patch: parseInt(match[3]),
        prereleaseType: match[4] || null,
        prereleaseNum: match[5] ? parseInt(match[5]) : null,
        build: match[6] || null,
    };
}
/**
 * Format the version object into a string
 * @param version - Version object
 * @returns Formatted version string
 */
function formatVersion(version) {
    let formatted = `${version.major}.${version.minor}.${version.patch}`;
    if (version.prereleaseType) {
        formatted += `-${version.prereleaseType}-${version.prereleaseNum}`;
    }
    if (version.build) {
        formatted += `+${version.build}`;
    }
    return formatted;
}
/**
 * Get the order of prerelease types
 * @param {string} type The prerelease type
 * @returns {number} The order of the prerelease type
 * @returns {number} -1 if the type is not found
 * @returns {number} 0 for dev
 * @returns {number} 1 for alpha
 * @returns {number} 2 for beta
 * @returns {number} 3 for rc
 */
function getPrereleaseOrder(type) {
    const order = {
        [exports.PrereleaseTypes.NONE]: -1,
        [exports.PrereleaseTypes.DEV]: 0,
        [exports.PrereleaseTypes.ALPHA]: 1,
        [exports.PrereleaseTypes.BETA]: 2,
        [exports.PrereleaseTypes.RC]: 3,
    };
    return order[type] || -1;
}
/**
 * Bumps the version number in a WordPress plugin file
 *
 * @param filePath - Path to the WordPress plugin file
 * @param bumpType - Type of version bump to perform
 * @param prereleaseType - Type of prerelease to set/bump
 * @returns Object containing old version, new version, and whether version was bumped
 */
function bumpVersion(filePath, bumpType, prereleaseType) {
    // Validate inputs
    if (!Object.values(exports.BumpTypes).includes(bumpType)) {
        throw new Error(`Invalid bump type: ${bumpType}`);
    }
    if (!Object.values(exports.PrereleaseTypes).includes(prereleaseType)) {
        throw new Error(`Invalid prerelease type: ${prereleaseType}`);
    }
    // Read file
    if (!fs_1.default.existsSync(filePath)) {
        throw new Error(`File does not exist: ${filePath}`);
    }
    let fileContents = fs_1.default.readFileSync(filePath, 'utf8');
    // Extract current version
    const versionObj = extractVersion(fileContents);
    const currentVersion = formatVersion(versionObj);
    // Bump version
    switch (bumpType) {
        case exports.BumpTypes.MAJOR:
            versionObj.major++;
            versionObj.minor = 0;
            versionObj.patch = 0;
            break;
        case exports.BumpTypes.MINOR:
            versionObj.minor++;
            versionObj.patch = 0;
            break;
        case exports.BumpTypes.PATCH:
            versionObj.patch++;
            break;
        case exports.BumpTypes.BUILD:
            // format: YYYYMMDDHHmmss
            versionObj.build = new Date()
                .toISOString()
                .replace(/[-:]/g, '')
                .replace(/\.\d{3}Z$/, '')
                .replace('T', '');
            break;
        case exports.BumpTypes.STABLE:
            versionObj.prereleaseType = null;
            versionObj.prereleaseNum = null;
            versionObj.build = null;
            break;
    }
    if (prereleaseType !== exports.PrereleaseTypes.NONE) {
        if (versionObj.prereleaseType &&
            getPrereleaseOrder(prereleaseType) <
                getPrereleaseOrder(versionObj.prereleaseType)) {
            throw new Error('Prerelease downgrade is not allowed');
        }
        versionObj.prereleaseNum =
            versionObj.prereleaseType === prereleaseType && versionObj.prereleaseNum
                ? versionObj.prereleaseNum + 1
                : 1;
        versionObj.prereleaseType = prereleaseType;
    }
    const newVersion = formatVersion(versionObj);
    const isVersionBumped = newVersion !== currentVersion;
    if (isVersionBumped) {
        const { match, index } = findVersionPosition(fileContents);
        fileContents =
            fileContents.slice(0, index) +
                match.replace(currentVersion, newVersion) +
                fileContents.slice(index + match.length);
        fs_1.default.writeFileSync(filePath, fileContents, 'utf8');
    }
    return {
        oldVersion: currentVersion,
        newVersion: newVersion,
        isVersionBumped: isVersionBumped,
    };
}
