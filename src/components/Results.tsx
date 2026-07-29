import type { Question } from "../types";
import { PASS_SCORE, chapterTitle, didPass } from "../lib/exam";

type Props = {
  mode: "mock" | "practice";
  questions: Question[];
  answers: (number | null)[];
  score: number;
  onHome: () => void;
  onRetry: () => void;
};

export function Results({ mode, questions, answers, score, onHome, onRetry }: Props) {
  const total = questions.length;
  const passed = mode === "mock" ? didPass(score, total) : null;
  const letters = ["A", "B", "C", "D"] as const;

  return (
    <div className="results">
      <header className="results-hero">
        <p className="eyebrow">{mode === "mock" ? "Mock exam results" : "Practice results"}</p>
        <h1>
          {score} / {total}
        </h1>
        {mode === "mock" && (
          <p className={`pass-badge ${passed ? "pass" : "fail"}`}>
            {passed
              ? `Passed (need ${PASS_SCORE}/${total})`
              : `Did not pass (need ${PASS_SCORE}/${total})`}
          </p>
        )}
        <div className="results-actions">
          <button type="button" className="btn primary" onClick={onRetry}>
            Try again
          </button>
          <button type="button" className="btn ghost" onClick={onHome}>
            Home
          </button>
        </div>
      </header>

      <ol className="review-list">
        {questions.map((q, i) => {
          const ans = answers[i];
          const correct = ans === q.correctIndex;
          return (
            <li key={q.id} className={`review-item ${correct ? "ok" : "bad"}`}>
              <div className="review-head">
                <span className="review-num">{i + 1}</span>
                <span className="chapter-chip">{chapterTitle(q.chapter)}</span>
                <span className="review-mark">{correct ? "Correct" : "Incorrect"}</span>
              </div>
              <p className="review-prompt">{q.prompt}</p>
              <p className="review-answer">
                Your answer:{" "}
                {ans === null || ans === undefined
                  ? "No answer"
                  : `${letters[ans]}. ${q.choices[ans]}`}
              </p>
              {!correct && (
                <p className="review-correct">
                  Correct: {letters[q.correctIndex]}. {q.choices[q.correctIndex]}
                </p>
              )}
              <p className="review-explain">{q.explanation}</p>
              <a href={q.sourceUrl} target="_blank" rel="noreferrer">
                Source chapter
              </a>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
