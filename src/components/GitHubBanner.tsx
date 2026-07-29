const REPO_URL = "https://github.com/SwaroopH/cantest";

export function GitHubBanner() {
  return (
    <a
      className="github-fork"
      href={REPO_URL}
      target="_blank"
      rel="noopener noreferrer"
    >
      <span className="github-fork-label">Fork on GitHub</span>
    </a>
  );
}
