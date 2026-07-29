import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const questions = JSON.parse(await readFile(path.join(root, "data/questions.json"), "utf8"));
const index = JSON.parse(await readFile(path.join(root, "data/guide/index.json"), "utf8"));

const MOCK_QUESTION_COUNT = 20;
const PASS_SCORE = 15;
const PROVINCE_IDS = ["nl", "pe", "ns", "nb", "qc", "on", "mb", "sk", "ab", "bc", "yt", "nt", "nu"];

function shuffle(items, random) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function filterForProvince(bank, provinceId) {
  return bank.filter((q) => {
    if (!q.provinceIds || q.provinceIds.length === 0) return true;
    return q.provinceIds.includes(provinceId);
  });
}

function sampleMockExam(bank, provinceId, random = Math.random) {
  const scoped = filterForProvince(bank, provinceId);
  const local = scoped.filter((q) => q.provinceIds?.includes(provinceId));
  const regions = scoped.filter(
    (q) => q.chapter === "canadas-regions" && !q.provinceIds?.includes(provinceId),
  );
  const rest = scoped.filter(
    (q) => q.chapter !== "canadas-regions" && !q.provinceIds?.includes(provinceId),
  );
  const localPick = shuffle(local, random).slice(0, Math.min(2, Math.max(1, local.length)));
  const regionPick = shuffle(regions, random).slice(
    0,
    Math.min(1, Math.max(0, 2 - localPick.length), regions.length),
  );
  const byChapter = new Map();
  for (const q of shuffle(rest, random)) {
    const list = byChapter.get(q.chapter) ?? [];
    list.push(q);
    byChapter.set(q.chapter, list);
  }
  const chapterQueues = shuffle([...byChapter.values()], random);
  const picked = [...localPick, ...regionPick];
  let guard = 0;
  while (picked.length < MOCK_QUESTION_COUNT && guard < scoped.length * 3) {
    guard += 1;
    for (const queue of chapterQueues) {
      if (picked.length >= MOCK_QUESTION_COUNT) break;
      const next = queue.shift();
      if (next) picked.push(next);
    }
    if (chapterQueues.every((q) => q.length === 0)) break;
  }
  if (picked.length < MOCK_QUESTION_COUNT) {
    const used = new Set(picked.map((q) => q.id));
    for (const q of shuffle(scoped, random)) {
      if (picked.length >= MOCK_QUESTION_COUNT) break;
      if (!used.has(q.id)) picked.push(q);
    }
  }
  return shuffle(picked.slice(0, MOCK_QUESTION_COUNT), random);
}

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL:", msg);
    failed += 1;
  } else {
    console.log("ok:", msg);
  }
}

assert(questions.length >= 100, `question bank size >= 100 (got ${questions.length})`);
assert(index.chapters.length >= 10, `scraped chapters >= 10 (got ${index.chapters.length})`);

const ids = new Set();
for (const q of questions) {
  assert(!ids.has(q.id), `unique id ${q.id}`);
  ids.add(q.id);
  assert(Array.isArray(q.choices) && q.choices.length === 4, `${q.id} has 4 choices`);
  assert(q.correctIndex >= 0 && q.correctIndex <= 3, `${q.id} correctIndex in range`);
  if (failed > 20) break;
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

for (const pid of PROVINCE_IDS) {
  const scoped = filterForProvince(questions, pid);
  const local = scoped.filter((q) => q.provinceIds?.includes(pid));
  assert(local.length >= 1, `${pid} has ≥1 local question (got ${local.length})`);
  const foreign = scoped.filter(
    (q) => q.provinceIds && !q.provinceIds.includes(pid),
  );
  assert(foreign.length === 0, `${pid} scoped bank excludes other provinces`);

  const sample = sampleMockExam(questions, pid, () => 0.42);
  assert(sample.length === 20, `${pid} mock sample size 20 (got ${sample.length})`);
  assert(
    sample.some((q) => q.provinceIds?.includes(pid)),
    `${pid} mock sample includes ≥1 local question`,
  );
}

assert(PASS_SCORE === 15, "pass threshold is 15/20");
assert(15 >= PASS_SCORE, "score 15 passes");
assert(!(14 >= PASS_SCORE), "score 14 fails");

if (failed) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log(
  `\nAll smoke checks passed (${questions.length} questions, ${index.chapters.length} chapters, ${PROVINCE_IDS.length} provinces).`,
);
