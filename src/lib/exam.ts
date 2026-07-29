import type { ProgressStore, Question } from "../types";
import { DEFAULT_PROVINCE, isProvinceId, type ProvinceId } from "./provinces";

export const MOCK_QUESTION_COUNT = 20;
export const MOCK_DURATION_SECONDS = 30 * 60;
export const PASS_SCORE = 15;

export const CHAPTERS: { id: string; title: string }[] = [
  { id: "rights-resonsibilities-citizenship", title: "Rights and Responsibilities" },
  { id: "who-are-canadians", title: "Who We Are" },
  { id: "canadas-history", title: "Canada's History" },
  { id: "modern-canada", title: "Modern Canada" },
  { id: "how-canadians-govern-themselves", title: "How Canadians Govern Themselves" },
  { id: "federal-elections", title: "Federal Elections" },
  { id: "justice-system", title: "The Justice System" },
  { id: "canadian-symbols", title: "Canadian Symbols" },
  { id: "canadas-economy", title: "Canada's Economy" },
  { id: "canadas-regions", title: "Canada's Regions" },
  { id: "study-questions", title: "Official Study Questions" },
  { id: "applying-citizenship", title: "Applying for Citizenship" },
  { id: "oath-citizenship", title: "The Oath of Citizenship" },
];

const PROGRESS_KEY = "cantest-progress";

export function shuffle<T>(items: T[], random = Math.random): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Keep national questions plus those tagged for the selected province. */
export function filterForProvince(bank: Question[], provinceId: ProvinceId): Question[] {
  return bank.filter((q) => {
    if (!q.provinceIds || q.provinceIds.length === 0) return true;
    return q.provinceIds.includes(provinceId);
  });
}

function isLocalQuestion(q: Question, provinceId: ProvinceId): boolean {
  return Boolean(q.provinceIds?.includes(provinceId));
}

/** Stratified sample of 20; always include ≥1 question for the selected province. */
export function sampleMockExam(
  bank: Question[],
  provinceId: ProvinceId,
  random = Math.random,
): Question[] {
  const scoped = filterForProvince(bank, provinceId);
  if (scoped.length <= MOCK_QUESTION_COUNT) {
    return shuffle(scoped, random);
  }

  const local = scoped.filter((q) => isLocalQuestion(q, provinceId));
  const regions = scoped.filter(
    (q) => q.chapter === "canadas-regions" && !isLocalQuestion(q, provinceId),
  );
  const rest = scoped.filter(
    (q) => q.chapter !== "canadas-regions" && !isLocalQuestion(q, provinceId),
  );

  const localPick = shuffle(local, random).slice(0, Math.min(2, Math.max(1, local.length)));
  const regionPick = shuffle(regions, random).slice(
    0,
    Math.min(1, Math.max(0, 2 - localPick.length), regions.length),
  );

  const byChapter = new Map<string, Question[]>();
  for (const q of shuffle(rest, random)) {
    const list = byChapter.get(q.chapter) ?? [];
    list.push(q);
    byChapter.set(q.chapter, list);
  }

  const chapterQueues = shuffle([...byChapter.values()], random);
  const picked: Question[] = [...localPick, ...regionPick];
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

export function filterByChapter(
  bank: Question[],
  chapter: string | "all",
  provinceId: ProvinceId,
): Question[] {
  const scoped = filterForProvince(bank, provinceId);
  if (chapter === "all") return shuffle(scoped);
  return shuffle(scoped.filter((q) => q.chapter === chapter));
}

export function scoreExam(questions: Question[], answers: (number | null)[]): number {
  let correct = 0;
  for (let i = 0; i < questions.length; i += 1) {
    if (answers[i] === questions[i].correctIndex) correct += 1;
  }
  return correct;
}

export function didPass(score: number, total = MOCK_QUESTION_COUNT): boolean {
  const required = Math.ceil((PASS_SCORE / MOCK_QUESTION_COUNT) * total);
  if (total === MOCK_QUESTION_COUNT) return score >= PASS_SCORE;
  return score >= required;
}

export function formatTime(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

function defaultProgress(): ProgressStore {
  return {
    provinceId: DEFAULT_PROVINCE,
    lastMockScore: null,
    lastMockPassed: null,
    lastMockAt: null,
    practiceAnswered: 0,
  };
}

export function loadProgress(): ProgressStore {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return defaultProgress();
    const parsed = JSON.parse(raw) as Partial<ProgressStore>;
    const provinceId =
      parsed.provinceId && isProvinceId(parsed.provinceId)
        ? parsed.provinceId
        : DEFAULT_PROVINCE;
    return {
      ...defaultProgress(),
      ...parsed,
      provinceId,
    };
  } catch {
    return defaultProgress();
  }
}

export function saveProgress(update: Partial<ProgressStore>): ProgressStore {
  const next = { ...loadProgress(), ...update };
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(next));
  return next;
}

export function chapterTitle(id: string): string {
  return CHAPTERS.find((c) => c.id === id)?.title ?? id;
}
