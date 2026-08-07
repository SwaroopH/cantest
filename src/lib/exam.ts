import type { ProgressStore, Question } from "../types";
import { DEFAULT_PROVINCE, isProvinceId, type ProvinceId } from "./provinces.ts";

export const MOCK_QUESTION_COUNT = 20;
export const MOCK_DURATION_SECONDS = 30 * 60;
export const PASS_SCORE = 15;
/** Rolling window of recently served mock question ids (≈3 exams). */
export const RECENT_MEMORY_LIMIT = 60;

/**
 * Curated chapter mix for a 20-question mock. IRCC publishes subject areas but no
 * per-chapter quotas; this is our study emphasis, weighted toward history, government
 * and rights like the guide itself.
 */
export const MOCK_BLUEPRINT: { chapter: string; count: number }[] = [
  { chapter: "canadas-history", count: 4 },
  { chapter: "how-canadians-govern-themselves", count: 3 },
  { chapter: "rights-resonsibilities-citizenship", count: 3 },
  { chapter: "canadas-regions", count: 2 }, // slot 1 is always province-local
  { chapter: "federal-elections", count: 2 },
  { chapter: "who-are-canadians", count: 2 },
  { chapter: "canadian-symbols", count: 2 },
  { chapter: "modern-canada", count: 1 },
];

/** Remaining slot(s) drawn from these, weighted by pool size so oath/applying stay rare. */
export const MOCK_MINOR_CHAPTERS = [
  "justice-system",
  "canadas-economy",
  "study-questions",
  "applying-citizenship",
  "oath-citizenship",
];

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

function isLocalQuestion(q: Question, provinceId: ProvinceId): boolean {
  return Boolean(q.provinceIds?.includes(provinceId));
}

function unseenFirst(
  pool: Question[],
  recentIds: ReadonlySet<string>,
  random: () => number,
): Question[] {
  const unseen = pool.filter((q) => !recentIds.has(q.id));
  const seen = pool.filter((q) => recentIds.has(q.id));
  return [...shuffle(unseen, random), ...shuffle(seen, random)];
}

function takeFromQueue(queue: Question[], n: number, used: Set<string>): Question[] {
  const out: Question[] = [];
  while (out.length < n && queue.length > 0) {
    const next = queue.shift()!;
    if (used.has(next.id)) continue;
    used.add(next.id);
    out.push(next);
  }
  return out;
}

/** Stratified sample of 20; always include ≥1 question for the selected province. */
export function sampleMockExam(
  bank: Question[],
  provinceId: ProvinceId,
  recentIds: readonly string[] = [],
  random = Math.random,
): Question[] {
  if (bank.length <= MOCK_QUESTION_COUNT) {
    return shuffle(bank, random);
  }

  const recent = new Set(recentIds);
  const used = new Set<string>();
  const picked: Question[] = [];
  let deficit = 0;

  const blueprintQuota = MOCK_BLUEPRINT.reduce((sum, e) => sum + e.count, 0);
  const flexCount = MOCK_QUESTION_COUNT - blueprintQuota;

  for (const { chapter, count } of MOCK_BLUEPRINT) {
    if (chapter === "canadas-regions") {
      const localPool = bank.filter((q) => isLocalQuestion(q, provinceId));
      const otherRegions = bank.filter(
        (q) => q.chapter === "canadas-regions" && !isLocalQuestion(q, provinceId),
      );
      const localQueue = unseenFirst(localPool, recent, random);
      const regionQueue = unseenFirst(otherRegions, recent, random);

      const localTake = takeFromQueue(localQueue, 1, used);
      picked.push(...localTake);
      if (localTake.length < 1) deficit += 1;

      const regionTake = takeFromQueue(regionQueue, Math.max(0, count - 1), used);
      picked.push(...regionTake);
      if (regionTake.length < Math.max(0, count - 1)) {
        deficit += Math.max(0, count - 1) - regionTake.length;
      }
      continue;
    }

    const pool = bank.filter((q) => q.chapter === chapter);
    const queue = unseenFirst(pool, recent, random);
    const take = takeFromQueue(queue, count, used);
    picked.push(...take);
    if (take.length < count) deficit += count - take.length;
  }

  const need = flexCount + deficit;
  if (need > 0) {
    const minorPools = MOCK_MINOR_CHAPTERS.map((chapter) => ({
      chapter,
      queue: unseenFirst(
        bank.filter((q) => q.chapter === chapter && !used.has(q.id)),
        recent,
        random,
      ),
    })).filter((p) => p.queue.length > 0);

    for (let i = 0; i < need; i += 1) {
      const totalWeight = minorPools.reduce((s, p) => s + p.queue.length, 0);
      if (totalWeight === 0) break;
      let r = random() * totalWeight;
      let chosen = minorPools[0]!;
      for (const pool of minorPools) {
        r -= pool.queue.length;
        if (r < 0) {
          chosen = pool;
          break;
        }
      }
      const take = takeFromQueue(chosen.queue, 1, used);
      if (take.length === 0) {
        const idx = minorPools.indexOf(chosen);
        if (idx >= 0) minorPools.splice(idx, 1);
        i -= 1;
        continue;
      }
      picked.push(...take);
      if (chosen.queue.length === 0) {
        const idx = minorPools.indexOf(chosen);
        if (idx >= 0) minorPools.splice(idx, 1);
      }
    }
  }

  if (picked.length < MOCK_QUESTION_COUNT) {
    const remaining = unseenFirst(
      bank.filter((q) => !used.has(q.id)),
      recent,
      random,
    );
    picked.push(...takeFromQueue(remaining, MOCK_QUESTION_COUNT - picked.length, used));
  }

  return shuffle(picked.slice(0, MOCK_QUESTION_COUNT), random);
}

export function filterByChapter(bank: Question[], chapter: string | "all"): Question[] {
  if (chapter === "all") return shuffle(bank);
  return shuffle(bank.filter((q) => q.chapter === chapter));
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
    recentQuestionIds: [],
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
    const recentQuestionIds = Array.isArray(parsed.recentQuestionIds)
      ? parsed.recentQuestionIds.filter((id): id is string => typeof id === "string")
      : [];
    return {
      ...defaultProgress(),
      ...parsed,
      provinceId,
      recentQuestionIds,
    };
  } catch {
    return defaultProgress();
  }
}

export function saveProgress(update: Partial<ProgressStore>): ProgressStore {
  const next = { ...loadProgress(), ...update };
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(next));
  } catch {
    // QuotaExceededError / SecurityError — keep returning in-memory progress.
  }
  return next;
}

export function chapterTitle(id: string): string {
  return CHAPTERS.find((c) => c.id === id)?.title ?? id;
}
