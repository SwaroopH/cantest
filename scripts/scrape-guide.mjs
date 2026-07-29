import * as cheerio from "cheerio";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "data", "guide");

const BASE =
  "https://www.canada.ca/en/immigration-refugees-citizenship/corporate/publications-manuals/discover-canada/read-online";

const CHAPTERS = [
  { id: "notice", slug: "notice.html", title: "Notice" },
  { id: "oath-citizenship", slug: "oath-citizenship.html", title: "The Oath of Citizenship" },
  { id: "message-readers", slug: "message-readers.html", title: "Message to Our Readers" },
  { id: "applying-citizenship", slug: "applying-citizenship.html", title: "Applying for Citizenship" },
  {
    id: "rights-resonsibilities-citizenship",
    slug: "rights-resonsibilities-citizenship.html",
    title: "Rights and Responsibilities of Citizenship",
  },
  { id: "who-are-canadians", slug: "who-are-canadians.html", title: "Who We Are" },
  { id: "canadas-history", slug: "canadas-history.html", title: "Canada's History" },
  { id: "modern-canada", slug: "modern-canada.html", title: "Modern Canada" },
  {
    id: "how-canadians-govern-themselves",
    slug: "how-canadians-govern-themselves.html",
    title: "How Canadians Govern Themselves",
  },
  { id: "federal-elections", slug: "federal-elections.html", title: "Federal Elections" },
  { id: "justice-system", slug: "justice-system.html", title: "The Justice System" },
  { id: "canadian-symbols", slug: "canadian-symbols.html", title: "Canadian Symbols" },
  { id: "canadas-economy", slug: "canadas-economy.html", title: "Canada's Economy" },
  { id: "canadas-regions", slug: "canadas-regions.html", title: "Canada's Regions" },
  { id: "study-questions", slug: "study-questions.html", title: "Study Questions" },
  { id: "more-information", slug: "more-information.html", title: "For More Information" },
  { id: "authorities", slug: "authorities.html", title: "Authorities" },
  { id: "memorable-quotes", slug: "memorable-quotes.html", title: "Memorable Quotes" },
];

function cleanText(text) {
  return text
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function shouldSkip($el) {
  const cls = ($el.attr("class") || "").toLowerCase();
  const id = ($el.attr("id") || "").toLowerCase();
  if (cls.includes("audio") || cls.includes("share") || cls.includes("gc-stm")) return true;
  if (id.includes("wb-info") || id.includes("wb-sec")) return true;
  const tag = $el.prop("tagName")?.toLowerCase();
  if (tag === "nav" || tag === "aside" || tag === "footer" || tag === "script" || tag === "style") {
    return true;
  }
  return false;
}

function parseSections($, $main) {
  const sections = [];
  let current = { heading: "Introduction", paragraphs: [] };

  const pushCurrent = () => {
    if (current.paragraphs.length > 0 || current.heading !== "Introduction") {
      sections.push({
        heading: current.heading,
        paragraphs: current.paragraphs.filter(Boolean),
      });
    }
  };

  $main.find("h1, h2, h3, h4, p, li").each((_, el) => {
    const $el = $(el);
    if ($el.parents("nav, aside, footer, .pagedetails, .gc-stp-ca, .mwsdownload-text").length) {
      return;
    }
    if (shouldSkip($el)) return;

    const tag = el.tagName?.toLowerCase();
    const text = cleanText($el.text());
    if (!text) return;

    // Skip chrome / audio captions
    if (
      /^(listen to this chapter|download this chapter|duration:|you can also download|the audio may take)/i.test(
        text,
      )
    ) {
      return;
    }
    if (/^see larger version$/i.test(text)) return;
    if (/^page details$/i.test(text)) return;

    if (tag === "h1" || tag === "h2" || tag === "h3" || tag === "h4") {
      // Skip duplicate page title chrome
      if (tag === "h1" && sections.length === 0 && current.paragraphs.length === 0) {
        current.heading = text.replace(/^Discover Canada\s*-\s*/i, "").trim() || text;
        return;
      }
      pushCurrent();
      current = { heading: text, paragraphs: [] };
      return;
    }

    current.paragraphs.push(text);
  });

  pushCurrent();
  return sections.filter((s) => s.paragraphs.length > 0 || (s.heading && s.heading !== "Introduction"));
}

async function fetchChapter(chapter) {
  const url = `${BASE}/${chapter.slug}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "cantest-scraper/1.0 (personal study tool; +https://github.com/local)",
      Accept: "text/html",
    },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }
  const html = await res.text();
  const $ = cheerio.load(html);
  const $main = $("main").first();
  if (!$main.length) {
    throw new Error(`No <main> found for ${url}`);
  }

  // Remove noisy nodes before parsing
  $main.find("script, style, nav, aside, .pagedetails, .gc-stp-ca, audio, .wb-mltmd").remove();

  const pageTitle =
    cleanText($("h1").first().text()) ||
    cleanText($("title").first().text()).replace(/\s*-\s*Canada\.ca$/i, "") ||
    chapter.title;

  const sections = parseSections($, $main);

  return {
    id: chapter.id,
    title: pageTitle.replace(/^Discover Canada\s*-\s*/i, "").trim() || chapter.title,
    url,
    scrapedAt: new Date().toISOString(),
    sections,
  };
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const index = [];

  for (const chapter of CHAPTERS) {
    process.stdout.write(`Scraping ${chapter.id}... `);
    try {
      const doc = await fetchChapter(chapter);
      const outPath = path.join(OUT_DIR, `${chapter.id}.json`);
      await writeFile(outPath, JSON.stringify(doc, null, 2) + "\n", "utf8");
      index.push({
        id: doc.id,
        title: doc.title,
        url: doc.url,
        sectionCount: doc.sections.length,
        paragraphCount: doc.sections.reduce((n, s) => n + s.paragraphs.length, 0),
      });
      console.log(`ok (${doc.sections.length} sections)`);
    } catch (err) {
      console.log("FAILED");
      console.error(err);
      process.exitCode = 1;
    }
    // Be polite to canada.ca
    await new Promise((r) => setTimeout(r, 400));
  }

  await writeFile(
    path.join(OUT_DIR, "index.json"),
    JSON.stringify(
      {
        source: `${BASE}.html`,
        scrapedAt: new Date().toISOString(),
        chapters: index,
      },
      null,
      2,
    ) + "\n",
    "utf8",
  );

  console.log(`\nWrote ${index.length} chapters to data/guide/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
