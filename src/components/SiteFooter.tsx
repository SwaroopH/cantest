const REPO_URL = "https://github.com/SwaroopH/cantest";
const LICENSE_URL = `${REPO_URL}/blob/master/LICENSE`;
const NOTICE_URL = `${REPO_URL}/blob/master/NOTICE`;
const GUIDE_URL =
  "https://www.canada.ca/en/immigration-refugees-citizenship/corporate/publications-manuals/discover-canada/read-online.html";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="site-footer-row">
        <span className="label">CanTest</span>
        <span>
          Based on Discover Canada: The Rights and Responsibilities of Citizenship
        </span>
      </div>

      <p className="site-footer-byline">Made with ❤️ in Vancouver 🇨🇦</p>

      <small className="site-footer-legal">
        © {year} Swaroop Hegde. Code is{" "}
        <a href={LICENSE_URL} target="_blank" rel="noreferrer">
          MIT licensed
        </a>
        . Study content adapted from{" "}
        <a href={GUIDE_URL} target="_blank" rel="noreferrer">
          Discover Canada
        </a>{" "}
        © Government of Canada (IRCC), reproduced for non-commercial use — not an official
        version, and not made with the endorsement of the Government of Canada.{" "}
        <a href={NOTICE_URL} target="_blank" rel="noreferrer">
          Details
        </a>
        .
      </small>
    </footer>
  );
}
