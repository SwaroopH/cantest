import { useEffect, useMemo, useRef, useState } from "react";
import type { CoverageRow } from "./components/CoverageChart";
import { Results } from "./components/Results";
import { SiteFooter } from "./components/SiteFooter";
import { SiteHeader } from "./components/SiteHeader";
import { getQuestions } from "./data/loadQuestions";
import {
  CHAPTERS,
  MOCK_DURATION_SECONDS,
  PASS_SCORE,
  filterByChapter,
  filterForProvince,
  loadProgress,
  sampleMockExam,
  saveProgress,
  scoreExam,
} from "./lib/exam";
import { getProvince, type ProvinceId } from "./lib/provinces";
import { ExamScreen } from "./screens/ExamScreen";
import { HomeScreen } from "./screens/HomeScreen";
import type { ProgressStore, Question, View } from "./types";

type Session = {
  mode: "mock" | "practice";
  questions: Question[];
  answers: (number | null)[];
  index: number;
  secondsLeft: number;
};

export default function App() {
  const bank = useMemo(() => getQuestions(), []);
  const [view, setView] = useState<View>({ name: "home" });
  const [session, setSession] = useState<Session | null>(null);
  const [practiceChapter, setPracticeChapter] = useState<string | "all">("all");
  const [progress, setProgress] = useState<ProgressStore>(() => loadProgress());
  const [resultSnapshot, setResultSnapshot] = useState<{
    mode: "mock" | "practice";
    questions: Question[];
    answers: (number | null)[];
    score: number;
  } | null>(null);
  const finishingRef = useRef(false);

  const provinceId = progress.provinceId;
  const province = getProvince(provinceId);
  const scopedBank = useMemo(
    () => filterForProvince(bank, provinceId),
    [bank, provinceId],
  );

  const chapterCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const q of scopedBank) {
      counts[q.chapter] = (counts[q.chapter] ?? 0) + 1;
    }
    return counts;
  }, [scopedBank]);

  const coverage = useMemo<CoverageRow[]>(
    () =>
      CHAPTERS.filter((c) => chapterCounts[c.id]).map((c) => ({
        id: c.id,
        title: c.title,
        count: chapterCounts[c.id],
      })),
    [chapterCounts],
  );

  useEffect(() => {
    if (!session || session.mode !== "mock" || view.name !== "mock") return;
    if (session.secondsLeft <= 0) return;

    const id = window.setInterval(() => {
      setSession((prev) => {
        if (!prev || prev.mode !== "mock") return prev;
        return { ...prev, secondsLeft: Math.max(0, prev.secondsLeft - 1) };
      });
    }, 1000);

    return () => window.clearInterval(id);
  }, [session?.mode, view.name]);

  useEffect(() => {
    if (
      session &&
      session.mode === "mock" &&
      session.secondsLeft === 0 &&
      view.name === "mock" &&
      !finishingRef.current
    ) {
      finishSession(session);
    }
  }, [session, view.name]);

  function goHome() {
    setView({ name: "home" });
  }

  function setProvince(id: ProvinceId) {
    setProgress(saveProgress({ provinceId: id }));
  }

  function startMock() {
    finishingRef.current = false;
    const questions = sampleMockExam(bank, provinceId);
    setSession({
      mode: "mock",
      questions,
      answers: Array(questions.length).fill(null),
      index: 0,
      secondsLeft: MOCK_DURATION_SECONDS,
    });
    setView({ name: "mock" });
  }

  function startPractice() {
    finishingRef.current = false;
    const questions = filterByChapter(bank, practiceChapter, provinceId);
    if (questions.length === 0) return;
    setSession({
      mode: "practice",
      questions,
      answers: Array(questions.length).fill(null),
      index: 0,
      secondsLeft: 0,
    });
    setView({ name: "practice", chapter: practiceChapter });
  }

  function selectAnswer(choiceIndex: number) {
    setSession((prev) => {
      if (!prev) return prev;
      const wasUnanswered = prev.answers[prev.index] === null;
      const answers = [...prev.answers];
      answers[prev.index] = choiceIndex;
      if (prev.mode === "practice" && wasUnanswered) {
        queueMicrotask(() => {
          setProgress(
            saveProgress({ practiceAnswered: loadProgress().practiceAnswered + 1 }),
          );
        });
      }
      return { ...prev, answers };
    });
  }

  function goTo(index: number) {
    setSession((prev) => (prev ? { ...prev, index } : prev));
  }

  function finishSession(active: Session) {
    if (finishingRef.current) return;
    finishingRef.current = true;
    const score = scoreExam(active.questions, active.answers);
    if (active.mode === "mock") {
      setProgress(
        saveProgress({
          lastMockScore: score,
          lastMockPassed: score >= PASS_SCORE,
          lastMockAt: new Date().toISOString(),
        }),
      );
    }
    setResultSnapshot({
      mode: active.mode,
      questions: active.questions,
      answers: active.answers,
      score,
    });
    setSession(null);
    setView({ name: "results", mode: active.mode });
  }

  function retry() {
    if (resultSnapshot?.mode === "mock") startMock();
    else startPractice();
  }

  if (view.name === "results" && resultSnapshot) {
    return (
      <div className="app-shell">
        <SiteHeader onHome={goHome} shortLabel={province.shortLabel} />
        <Results
          mode={resultSnapshot.mode}
          questions={resultSnapshot.questions}
          answers={resultSnapshot.answers}
          score={resultSnapshot.score}
          onHome={goHome}
          onRetry={retry}
        />
        <SiteFooter />
      </div>
    );
  }

  if ((view.name === "mock" || view.name === "practice") && session) {
    const answeredCount = session.answers.filter((a) => a !== null).length;

    return (
      <div className="app-shell">
        <SiteHeader
          onHome={goHome}
          shortLabel={province.shortLabel}
          progress={answeredCount / session.questions.length}
        />
        <ExamScreen
          mode={session.mode}
          questions={session.questions}
          answers={session.answers}
          index={session.index}
          secondsLeft={session.secondsLeft}
          onSelect={selectAnswer}
          onGoTo={goTo}
          onFinish={() => finishSession(session)}
        />
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <SiteHeader onHome={goHome} shortLabel={province.shortLabel} />
      <HomeScreen
        province={province}
        questionCount={scopedBank.length}
        coverage={coverage}
        chapterCounts={chapterCounts}
        practiceChapter={practiceChapter}
        progress={progress}
        onProvinceChange={setProvince}
        onPracticeChapterChange={setPracticeChapter}
        onStartMock={startMock}
        onStartPractice={startPractice}
      />
      <SiteFooter />
    </div>
  );
}
