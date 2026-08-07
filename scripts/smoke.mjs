import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  CHAPTERS,
  MOCK_BLUEPRINT,
  MOCK_MINOR_CHAPTERS,
  MOCK_QUESTION_COUNT,
  PASS_SCORE,
  RECENT_MEMORY_LIMIT,
  sampleMockExam,
} from "../src/lib/exam.ts";
import { isProvinceId } from "../src/lib/provinces.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const questions = JSON.parse(await readFile(path.join(root, "data/questions.json"), "utf8"));
const index = JSON.parse(await readFile(path.join(root, "data/guide/index.json"), "utf8"));

const PROVINCE_IDS = ["nl", "pe", "ns", "nb", "qc", "on", "mb", "sk", "ab", "bc", "yt", "nt", "nu"];
const chapterUrls = new Map(index.chapters.map((c) => [c.id, c.url]));
const chapterIds = new Set(CHAPTERS.map((c) => c.id));
const minorSet = new Set(MOCK_MINOR_CHAPTERS);

/** Deterministic PRNG (mulberry32). */
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let failed = 0;
let passed = 0;
function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL:", msg);
    failed += 1;
  } else {
    passed += 1;
  }
}

assert(questions.length >= 250, `question bank size >= 250 (got ${questions.length})`);
assert(index.chapters.length >= 10, `scraped chapters >= 10 (got ${index.chapters.length})`);

const blueprintQuota = MOCK_BLUEPRINT.reduce((sum, e) => sum + e.count, 0);
const flexCount = MOCK_QUESTION_COUNT - blueprintQuota;
assert(flexCount >= 1, `blueprint leaves ≥1 flex slot (got ${flexCount})`);
assert(
  blueprintQuota + flexCount === MOCK_QUESTION_COUNT,
  `blueprint quotas + flex === ${MOCK_QUESTION_COUNT}`,
);
for (const { chapter, count } of MOCK_BLUEPRINT) {
  const n = questions.filter((q) => q.chapter === chapter).length;
  assert(n >= count, `blueprint ${chapter}: bank has ≥${count} (got ${n})`);
}
assert(MOCK_MINOR_CHAPTERS.length >= 1, "MOCK_MINOR_CHAPTERS is non-empty");

const ids = new Set();
const prompts = new Set();
for (const q of questions) {
  assert(!ids.has(q.id), `unique id ${q.id}`);
  ids.add(q.id);

  assert(typeof q.prompt === "string" && q.prompt.trim().length > 0, `${q.id} non-empty prompt`);
  assert(
    typeof q.explanation === "string" && q.explanation.trim().length > 0,
    `${q.id} non-empty explanation`,
  );
  assert(Array.isArray(q.choices) && q.choices.length === 4, `${q.id} has 4 choices`);
  assert(
    q.choices.every((c) => typeof c === "string" && c.trim().length > 0),
    `${q.id} non-empty choices`,
  );
  assert(new Set(q.choices).size === 4, `${q.id} distinct choices`);
  assert(
    Number.isInteger(q.correctIndex) && q.correctIndex >= 0 && q.correctIndex <= 3,
    `${q.id} correctIndex in range`,
  );
  assert(chapterIds.has(q.chapter), `${q.id} chapter ${q.chapter} is in CHAPTERS`);
  assert(
    q.sourceUrl === chapterUrls.get(q.chapter),
    `${q.id} sourceUrl matches chapter url`,
  );
  assert(!prompts.has(q.prompt), `unique prompt for ${q.id}`);
  prompts.add(q.prompt);

  if (q.provinceIds) {
    assert(Array.isArray(q.provinceIds), `${q.id} provinceIds is array`);
    for (const pid of q.provinceIds) {
      assert(isProvinceId(pid), `${q.id} provinceId ${pid} is valid`);
    }
  }
  if (failed > 40) break;
}

const answerPositionCounts = [0, 0, 0, 0];
for (const q of questions) {
  if (Number.isInteger(q.correctIndex) && q.correctIndex >= 0 && q.correctIndex <= 3) {
    answerPositionCounts[q.correctIndex] += 1;
  }
}
for (let i = 0; i < 4; i += 1) {
  const rate = answerPositionCounts[i] / questions.length;
  assert(
    rate >= 0.15 && rate <= 0.35,
    `correctIndex ${i} share in 15–35% (got ${(rate * 100).toFixed(1)}%, n=${answerPositionCounts[i]})`,
  );
}

const official = ["sq-01", "sq-02", "sq-03"];
for (const id of official) {
  assert(questions.some((q) => q.id === id), `includes official ${id}`);
}

assert(
  questions.some(
    (q) =>
      q.provinceIds?.includes("bc") &&
      /Victoria/i.test(q.prompt + q.choices.join(" ")),
  ),
  "includes BC capital Victoria question",
);

function chapterCounts(sample) {
  const counts = new Map();
  for (const q of sample) counts.set(q.chapter, (counts.get(q.chapter) ?? 0) + 1);
  return counts;
}

function assertSampleShape(sample, pid, label) {
  assert(sample.length === MOCK_QUESTION_COUNT, `${label} size ${MOCK_QUESTION_COUNT} (got ${sample.length})`);
  const sampleIds = sample.map((q) => q.id);
  assert(
    new Set(sampleIds).size === sampleIds.length,
    `${label} has unique question ids`,
  );
  assert(
    sample.some((q) => q.provinceIds?.includes(pid)),
    `${label} includes ≥1 local question`,
  );

  const counts = chapterCounts(sample);
  for (const { chapter, count } of MOCK_BLUEPRINT) {
    if (chapter === "canadas-regions") {
      const locals = sample.filter((q) => q.provinceIds?.includes(pid));
      const otherRegions = sample.filter(
        (q) => q.chapter === "canadas-regions" && !q.provinceIds?.includes(pid),
      );
      assert(locals.length >= 1, `${label} regions slot 1: ≥1 local`);
      assert(otherRegions.length >= 1, `${label} regions slot 2: ≥1 non-local region`);
      assert(
        (counts.get("canadas-regions") ?? 0) >= count,
        `${label} canadas-regions ≥${count} (got ${counts.get("canadas-regions") ?? 0})`,
      );
      continue;
    }
    assert(
      (counts.get(chapter) ?? 0) === count,
      `${label} ${chapter} count === ${count} (got ${counts.get(chapter) ?? 0})`,
    );
  }

  const minorCount = sample.filter((q) => minorSet.has(q.chapter)).length;
  assert(minorCount >= flexCount, `${label} minors ≥ flex ${flexCount} (got ${minorCount})`);
}

for (const pid of PROVINCE_IDS) {
  const local = questions.filter((q) => q.provinceIds?.includes(pid));
  assert(local.length >= 1, `${pid} has ≥1 local question (got ${local.length})`);

  const sample = sampleMockExam(questions, pid, [], () => 0.42);
  assertSampleShape(sample, pid, `${pid} shape sample`);
}

// Coverage + frequency (seeded, deterministic)
const SIMS = 2000;
for (const pid of PROVINCE_IDS) {
  const rng = mulberry32(0xc0ffee ^ [...pid].reduce((a, c) => a + c.charCodeAt(0), 0));
  const counts = new Map(questions.map((q) => [q.id, 0]));
  const localIds = new Set(
    questions.filter((q) => q.provinceIds?.includes(pid)).map((q) => q.id),
  );

  for (let i = 0; i < SIMS; i += 1) {
    const sample = sampleMockExam(questions, pid, [], rng);
    if (i === 0) assertSampleShape(sample, pid, `${pid} sim[0]`);
    for (const q of sample) counts.set(q.id, (counts.get(q.id) ?? 0) + 1);
  }

  const missing = [...counts.entries()].filter(([, n]) => n === 0).map(([id]) => id);
  assert(
    missing.length === 0,
    `${pid} coverage: all ${questions.length} questions appear (≥1 in ${SIMS} exams); missing ${missing.length}: ${missing.slice(0, 8).join(", ")}`,
  );

  if (pid === "on") {
    assert(
      (counts.get("rg-01") ?? 0) > 0,
      "ON exams can draw rg-01 (BC capital; cross-province reachability)",
    );
  }

  const localCount = localIds.size;
  const localFloor = 0.5 / localCount;
  for (const [id, n] of counts) {
    const rate = n / SIMS;
    const isLocal = localIds.has(id);
    if (isLocal) {
      assert(rate <= 0.6, `${pid} local ${id} rate ≤60% (got ${(rate * 100).toFixed(1)}%)`);
      assert(
        rate >= localFloor,
        `${pid} local ${id} rate ≥${(localFloor * 100).toFixed(1)}% (got ${(rate * 100).toFixed(1)}%)`,
      );
    } else {
      assert(rate <= 0.35, `${pid} non-local ${id} rate ≤35% (got ${(rate * 100).toFixed(1)}%)`);
    }
  }
}

// Recency: sequential exams with rolling recent window
{
  const pid = "on";
  const rng = mulberry32(0x7e5e10);
  let recent = [];
  const overlaps = [];
  let prevIds = null;
  for (let i = 0; i < 10; i += 1) {
    const sample = sampleMockExam(questions, pid, recent, rng);
    const idsNow = new Set(sample.map((q) => q.id));
    if (prevIds) {
      let overlap = 0;
      for (const id of idsNow) if (prevIds.has(id)) overlap += 1;
      overlaps.push(overlap);
    }
    recent = [...recent, ...sample.map((q) => q.id)].slice(-RECENT_MEMORY_LIMIT);
    prevIds = idsNow;
  }
  const mean = overlaps.reduce((a, b) => a + b, 0) / overlaps.length;
  assert(mean <= 3, `recency mean consecutive overlap ≤3 (got ${mean.toFixed(2)})`);
}

assert(PASS_SCORE === 15, "pass threshold is 15/20");
assert(15 >= PASS_SCORE, "score 15 passes");
assert(!(14 >= PASS_SCORE), "score 14 fails");

if (failed) {
  console.error(`\n${failed} check(s) failed (${passed} passed)`);
  process.exit(1);
}
console.log(
  `All smoke checks passed (${passed} assertions, ${questions.length} questions, ${index.chapters.length} chapters, ${PROVINCE_IDS.length} provinces).`,
);
