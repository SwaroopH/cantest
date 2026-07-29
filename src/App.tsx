import { useEffect, useMemo, useRef, useState } from "react";
import { ChapterPicker } from "./components/ChapterPicker";
import { ProvincePicker } from "./components/ProvincePicker";
import { QuestionCard } from "./components/QuestionCard";
import { Results } from "./components/Results";
import { Timer } from "./components/Timer";
import { getQuestions } from "./data/loadQuestions";
import {
  CHAPTERS,
  MOCK_DURATION_SECONDS,
  MOCK_QUESTION_COUNT,
  PASS_SCORE,
  filterByChapter,
  filterForProvince,
  loadProgress,
  sampleMockExam,
  saveProgress,
  scoreExam,
} from "./lib/exam";
import { getProvince, type ProvinceId } from "./lib/provinces";
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
        <SiteHeader
          onHome={() => setView({ name: "home" })}
          shortLabel={province.shortLabel}
        />
        <main className="main">
          <Results
            mode={resultSnapshot.mode}
            questions={resultSnapshot.questions}
            answers={resultSnapshot.answers}
            score={resultSnapshot.score}
            onHome={() => setView({ name: "home" })}
            onRetry={retry}
          />
        </main>
        <SiteFooter />
      </div>
    );
  }

  if ((view.name === "mock" || view.name === "practice") && session) {
    const q = session.questions[session.index];
    const answeredCount = session.answers.filter((a) => a !== null).length;
    const isPractice = session.mode === "practice";

    return (
      <div className="app-shell">
        <SiteHeader
          onHome={() => setView({ name: "home" })}
          shortLabel={province.shortLabel}
        />
        <main className="main exam">
          <div className="exam-toolbar">
            {session.mode === "mock" ? (
              <Timer secondsLeft={session.secondsLeft} totalSeconds={MOCK_DURATION_SECONDS} />
            ) : (
              <p className="practice-label">Practice · untimed</p>
            )}
            <p className="answered-count">
              Answered {answeredCount}/{session.questions.length}
            </p>
          </div>

          <QuestionCard
            question={q}
            index={session.index}
            total={session.questions.length}
            selected={session.answers[session.index]}
            onSelect={selectAnswer}
            revealCorrect={isPractice}
          />

          <nav className="exam-nav">
            <button
              type="button"
              className="btn ghost"
              disabled={session.index === 0}
              onClick={() => goTo(session.index - 1)}
            >
              Previous
            </button>
            {session.index < session.questions.length - 1 ? (
              <button
                type="button"
                className="btn primary"
                disabled={isPractice && session.answers[session.index] === null}
                onClick={() => goTo(session.index + 1)}
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                className="btn primary"
                onClick={() => finishSession(session)}
              >
                {session.mode === "mock" ? "Submit exam" : "Finish practice"}
              </button>
            )}
          </nav>

          <div className="question-dots" aria-label="Question navigator">
            {session.questions.map((_, i) => {
              const locked =
                isPractice && session.answers[i] === null && i > session.index;
              return (
                <button
                  key={i}
                  type="button"
                  className={`dot ${i === session.index ? "current" : ""} ${
                    session.answers[i] !== null ? "filled" : ""
                  }`}
                  disabled={locked}
                  onClick={() => goTo(i)}
                  aria-label={`Go to question ${i + 1}`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <SiteHeader
        onHome={() => setView({ name: "home" })}
        shortLabel={province.shortLabel}
      />
      <main className="main home">
        <section className="hero">
          <p className="eyebrow">{province.name} · Discover Canada</p>
          <h1>Citizenship mock test</h1>
          <p className="lede">
            Practice with {scopedBank.length} questions drawn from the official Discover Canada
            study guide (including {province.capital} capital/region items). Mock exams:{" "}
            {MOCK_QUESTION_COUNT} questions, 30 minutes, pass with {PASS_SCORE}/
            {MOCK_QUESTION_COUNT}.
          </p>
        </section>

        <ProvincePicker value={provinceId} onChange={setProvince} />

        <section className="mode-grid">
          <article className="mode-card">
            <h2>Mock exam</h2>
            <p>
              Timed {MOCK_QUESTION_COUNT}-question set with chapter mix and at least one{" "}
              {province.shortLabel} / regions question.
            </p>
            <button type="button" className="btn primary" onClick={startMock}>
              Start mock exam
            </button>
            {progress.lastMockScore !== null && (
              <p className="progress-note">
                Last score: {progress.lastMockScore}/{MOCK_QUESTION_COUNT}{" "}
                {progress.lastMockPassed ? "(passed)" : "(not passed)"}
              </p>
            )}
          </article>

          <article className="mode-card">
            <h2>Practice by chapter</h2>
            <p>Untimed practice with immediate feedback after each answer.</p>
            <ChapterPicker
              value={practiceChapter}
              onChange={setPracticeChapter}
              counts={chapterCounts}
            />
            <button type="button" className="btn primary" onClick={startPractice}>
              Start practice
            </button>
            {progress.practiceAnswered > 0 && (
              <p className="progress-note">
                Practice answers recorded: {progress.practiceAnswered}
              </p>
            )}
          </article>
        </section>

        <section className="coverage">
          <h2>Coverage</h2>
          <ul>
            {CHAPTERS.filter((c) => chapterCounts[c.id]).map((c) => (
              <li key={c.id}>
                <span>{c.title}</span>
                <span>{chapterCounts[c.id]}</span>
              </li>
            ))}
          </ul>
        </section>

        <aside className="disclaimer">
          <strong>Unofficial study aid.</strong> Only IRCC’s Discover Canada guide is
          authoritative. Third-party tests and questions are not official. Source:{" "}
          <a
            href="https://www.canada.ca/en/immigration-refugees-citizenship/corporate/publications-manuals/discover-canada/read-online.html"
            target="_blank"
            rel="noreferrer"
          >
            Discover Canada (Canada.ca)
          </a>
          .
        </aside>
      </main>
      <SiteFooter />
    </div>
  );
}

function SiteHeader({
  onHome,
  shortLabel,
}: {
  onHome: () => void;
  shortLabel: string;
}) {
  return (
    <header className="site-header">
      <button type="button" className="brand" onClick={onHome}>
        CanTest
      </button>
      <span className="region-tag">{shortLabel}</span>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="site-footer">
      Based on Discover Canada: The Rights and Responsibilities of Citizenship
    </footer>
  );
}
