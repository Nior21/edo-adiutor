import { GITHUB_REPO, RELEASE_EPF_ASSET_NAME } from "./releaseConfig";
import { normalizeSemver } from "./semverCompare";

export type GithubReleaseInfo = {
  version: string;
  epfUrl: string;
  notes: string;
  htmlUrl: string;
};

type GithubReleaseJson = {
  tag_name?: string;
  name?: string;
  body?: string;
  html_url?: string;
  assets?: Array<{ name?: string; browser_download_url?: string }>;
};

function pickEpfAssetUrl(release: GithubReleaseJson): string {
  const assets = release.assets ?? [];
  const byName = assets.find((a) => a.name === RELEASE_EPF_ASSET_NAME);
  if (byName?.browser_download_url) {
    return byName.browser_download_url;
  }
  const epf = assets.find((a) => (a.name ?? "").toLowerCase().endsWith(".epf"));
  return epf?.browser_download_url ?? "";
}

export async function fetchLatestGithubRelease(): Promise<GithubReleaseInfo | null> {
  const url = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;
  const response = await fetch(url, {
    headers: { Accept: "application/vnd.github+json" },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`GitHub releases: HTTP ${response.status}`);
  }

  const data = (await response.json()) as GithubReleaseJson;
  const version = normalizeSemver(data.tag_name ?? data.name ?? "");
  const epfUrl = pickEpfAssetUrl(data);

  if (!version || !epfUrl) {
    return null;
  }

  return {
    version,
    epfUrl,
    notes: (data.body ?? "").trim().slice(0, 500),
    htmlUrl: data.html_url ?? `https://github.com/${GITHUB_REPO}/releases/latest`,
  };
}
