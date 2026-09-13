import { compareSemver } from "./semverCompare";
import type { GithubReleaseInfo } from "./githubReleases";
import type { UpdateInfoPayload } from "./types";

export function mergeGithubIntoUpdateInfo(
  base: UpdateInfoPayload | null,
  currentVersion: string,
  github: GithubReleaseInfo | null,
  githubError: string,
): UpdateInfoPayload | null {
  const epfPath = base?.epfPath ?? "";
  const localReleases = base?.localReleases ?? [];

  if (!github) {
    if (!base && !githubError) {
      return null;
    }
    return {
      phase: "check",
      uiMode: "normal",
      currentVersion,
      latestVersion: base?.latestVersion ?? currentVersion,
      updateAvailable: base?.updateAvailable ?? false,
      manifestConfigured: Boolean(base?.manifestConfigured),
      epfPath,
      localReleases,
      error: githubError || base?.error,
      notes: base?.notes,
      epfUrl: base?.epfUrl,
      targetVersion: base?.targetVersion,
      localLatestVersion: base?.localLatestVersion,
      localHasTarget: base?.localHasTarget,
    };
  }

  const updateAvailable = compareSemver(github.version, currentVersion) > 0;

  return {
    phase: "check",
    uiMode: "normal",
    currentVersion,
    latestVersion: github.version,
    targetVersion: github.version,
    remoteLatestVersion: github.version,
    updateAvailable,
    autoSwitchRecommended: updateAvailable && Boolean(epfPath),
    manifestConfigured: true,
    epfPath,
    epfUrl: github.epfUrl,
    notes: github.notes,
    error: githubError || base?.error,
    localReleases,
    localLatestVersion: base?.localLatestVersion,
    localHasTarget: base?.localHasTarget,
    githubReleaseUrl: github.htmlUrl,
  };
}
