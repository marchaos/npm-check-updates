"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.newest = exports.patch = exports.minor = exports.greatestLevel = exports.greatest = exports.latest = void 0;
/** Fetches package metadata from Github tags. */
const parse_github_url_1 = __importDefault(require("parse-github-url"));
const remote_git_tags_1 = __importDefault(require("remote-git-tags"));
const semver_1 = __importDefault(require("semver"));
const logging_1 = require("../lib/logging");
const versionUtil = __importStar(require("../lib/version-util"));
/** Gets remote versions sorted. */
const getSortedVersions = async (name, declaration, options) => {
    // if present, github: is parsed as the protocol. This is not valid when passed into remote-git-tags.
    declaration = declaration.replace(/^github:/, '');
    const { auth, protocol, host, path } = (0, parse_github_url_1.default)(declaration);
    let tagMap = new Map();
    let tagsPromise = Promise.resolve(tagMap);
    const protocolKnown = protocol != null;
    if (protocolKnown) {
        tagsPromise = tagsPromise.then(() => (0, remote_git_tags_1.default)(`${protocol ? protocol.replace('git+', '') : 'https:'}//${auth ? auth + '@' : ''}${host}/${path}`));
    }
    else {
        // try ssh first, then https on failure
        tagsPromise = tagsPromise
            .then(() => (0, remote_git_tags_1.default)(`ssh://git@${host}/${path}`))
            .catch(() => (0, remote_git_tags_1.default)(`https://${auth ? auth + '@' : ''}${host}/${path}`));
    }
    // fetch remote tags
    try {
        tagMap = await tagsPromise;
    }
    catch (e) {
        // catch a variety of errors that occur on invalid or private repos
        (0, logging_1.print)(options, `Invalid, private repo, or no tags for ${name}: ${declaration}`, 'verbose');
        return null;
    }
    // eslint-disable-next-line fp/no-mutating-methods
    const tags = Array.from(tagMap.keys())
        .map(versionUtil.fixPseudoVersion)
        // do not pass semver.valid reference directly since the mapping index will be interpreted as the loose option
        // https://github.com/npm/node-semver#functions
        .filter(tag => semver_1.default.valid(tag))
        .sort(versionUtil.compareVersions);
    return tags;
};
/** Return the highest non-prerelease numbered tag on a remote Git URL. */
const latest = async (name, declaration, options) => {
    const versions = await getSortedVersions(name, declaration, options);
    if (!versions)
        return null;
    const versionsFiltered = options.pre ? versions : versions.filter(v => !versionUtil.isPre(v));
    const latestVersion = versionsFiltered[versionsFiltered.length - 1];
    return latestVersion ? versionUtil.upgradeGithubUrl(declaration, latestVersion) : null;
};
exports.latest = latest;
/** Return the highest numbered tag on a remote Git URL. */
const greatest = async (name, declaration, options) => {
    const versions = await getSortedVersions(name, declaration, options);
    if (!versions)
        return null;
    const greatestVersion = versions[versions.length - 1];
    return greatestVersion ? versionUtil.upgradeGithubUrl(declaration, greatestVersion) : null;
};
exports.greatest = greatest;
/** Returns a function that returns the highest version at the given level. */
const greatestLevel = (level) => async (name, declaration, options = {}) => {
    const version = decodeURIComponent((0, parse_github_url_1.default)(declaration).branch).replace(/^semver:/, '');
    const versions = await getSortedVersions(name, declaration, options);
    if (!versions)
        return null;
    const greatestMinor = versionUtil.findGreatestByLevel(versions.map(v => v.replace(/^v/, '')), version, level);
    return greatestMinor ? versionUtil.upgradeGithubUrl(declaration, greatestMinor) : null;
};
exports.greatestLevel = greatestLevel;
exports.minor = (0, exports.greatestLevel)('minor');
exports.patch = (0, exports.greatestLevel)('patch');
// use greatest for newest rather than leaving newest undefined
// this allows a mix of npm and github urls to be used in a package file without causing an "Unsupported target" error
exports.newest = exports.greatest;
//# sourceMappingURL=gitTags.js.map