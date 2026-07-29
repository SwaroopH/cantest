import type { Question } from "../types";
import { MOCK_QUESTION_COUNT, PASS_SCORE, chapterTitle, didPass } from "../lib/exam";

type Props = {
  mode: "mock" | "practice";
  questions: Question[];
  answers: (number | null)[];
  score: number;
  onHome: () => void;
  onRetry: () => void;
};

const LETTERS = ["A", "B", "C", "D"] as const;
const MARK_OK = "■";
const MARK_BAD = "✕";

export function Results({ mode, questions, answers, score, onHome, onRetry }: Props) {
  const total = questions.length;
  const passed = mode === "mock" ? didPass(score, total) : null;

  return (
    <>
      <div className="band band-inverse">
        <div className="band-inner scoreband-inner">
          <div className="score">
            <p className="eyebrow">
              {mode === "mock" ? "Mock exam · result" : "Practice · result"}
            </p>
            <p
              className="score-fraction"
              role="img"
              aria-label={`Scored ${score} out of ${total}`}
            >
              <span className="score-got" aria-hidden="true">
                {score}
              </span>
              <span className="score-slash" aria-hidden="true" />
              <span className="score-total outline-type" aria-hidden="true">
                {total}
              </span>
            </p>
          </div>

          {mode === "mock" && (
            <p className={`verdict ${passed ? "verdict--pass" : "verdict--fail"}`}>
              <span className="verdict-line">
                <span aria-hidden="true">{passed ? MARK_OK : MARK_BAD}</span>
                {passed ? "Approved" : "Not yet"}
              </span>
              <span className="verdict-sub">
                {PASS_SCORE} of {MOCK_QUESTION_COUNT} to pass
              </span>
            </p>
          )}

          <div className="scoreband-actions">
            <button type="button" className="btn btn--marigold" onClick={onRetry}>
              Try again
            </button>
            <button type="button" className="btn btn--ghost" onClick={onHome}>
              Home
            </button>
          </div>
        </div>
      </div>

      <main className="main results">
        <div className="section-head">
          <h2>Review</h2>
          <span className="label muted">{total} questions</span>
        </div>

        <ol className="ledger">
          {questions.map((q, i) => {
            const ans = answers[i];
            const correct = ans === q.correctIndex;

            return (
              <li
                key={q.id}
                className={`ledger-row ${correct ? "ledger-row--ok" : "ledger-row--bad"}`}
              >
                <div className="ledger-gutter">
                  <span className="ledger-num">{String(i + 1).padStart(2, "0")}</span>
                  <span className="ledger-mark" aria-hidden="true">
                    {correct ? MARK_OK : MARK_BAD}
                  </span>
                </div>

                <div>
                  <div className="ledger-head">
                    <span className="chip">{chapterTitle(q.chapter)}</span>
                    <span className="ledger-verdict">
                      {correct ? "Correct" : "Incorrect"}
                    </span>
                  </div>

                  <p className="ledger-prompt">{q.prompt}</p>

                  <dl className="ledger-answers">
                    <dt className="label">Your answer</dt>
                    <dd>
                      {ans === null || ans === undefined ? (
                        <span className="muted">No answer</span>
                      ) : (
                        <>
                          <span className="num">{LETTERS[ans]}</span>
                          {q.choices[ans]}
                        </>
                      )}
                    </dd>

                    {!correct && (
                      <>
                        <dt className="label">Correct</dt>
                        <dd>
                          <span className="num">{LETTERS[q.correctIndex]}</span>
                          {q.choices[q.correctIndex]}
                        </dd>
                      </>
                    )}
                  </dl>

                  <p className="ledger-explain">{q.explanation}</p>

                  <a className="ledger-src" href={q.sourceUrl} target="_blank" rel="noreferrer">
                    Source chapter
                  </a>
                </div>
              </li>
            );
          })}
        </ol>
      </main>
    </>
  );
}
