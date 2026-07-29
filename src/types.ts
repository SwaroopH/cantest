import type { ProvinceId } from "./lib/provinces";

export type Question = {
  id: string;
  chapter: string;
  prompt: string;
  choices: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  explanation: string;
  sourceUrl: string;
  /** If set, question only appears when the learner's province is listed. */
  provinceIds?: ProvinceId[];
};

export type ChapterMeta = {
  id: string;
  title: string;
};

export type View =
  | { name: "home" }
  | { name: "mock" }
  | { name: "practice"; chapter: string | "all" }
  | { name: "results"; mode: "mock" | "practice" };

export type ExamAnswer = number | null;

export type ProgressStore = {
  provinceId: ProvinceId;
  lastMockScore: number | null;
  lastMockPassed: boolean | null;
  lastMockAt: string | null;
  practiceAnswered: number;
};
