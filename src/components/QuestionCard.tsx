import type { Question } from "../types";
import { chapterTitle } from "../lib/exam";

type Props = {
  question: Question;
  index: number;
  total: number;
  selected: number | null;
  onSelect: (choiceIndex: number) => void;
  /** When set, show immediate feedback (practice mode). */
  revealCorrect?: boolean;
  disabled?: boolean;
};

const LETTERS = ["A", "B", "C", "D"] as const;
const MARK_OK = "■";
const MARK_BAD = "✕";

export function QuestionCard({
  question,
  index,
  total,
  selected,
  onSelect,
  revealCorrect = false,
  disabled = false,
}: Props) {
  const revealed = revealCorrect && selected !== null;
  const gotItRight = selected === question.correctIndex;

  return (
    <article className="question">
      <header className="question-head">
        <span className="question-index num outline-type" aria-hidden="true">
          {String(index + 1).padStart(2, "0")}
        </span>
        <div className="question-head-meta">
          <p className="eyebrow">
            Question {index + 1} of {total}
          </p>
          <span className="chip chip--signal">{chapterTitle(question.chapter)}</span>
        </div>
      </header>

      <h2 className="question-prompt">{question.prompt}</h2>

      <ul className="choices">
        {question.choices.map((choice, i) => {
          const isSelected = selected === i;
          const isCorrect = i === question.correctIndex;

          let stateClass = "";
          let mark = "";
          if (revealed) {
            if (isCorrect) {
              stateClass = "choice--correct";
              mark = MARK_OK;
            } else if (isSelected) {
              stateClass = "choice--wrong";
              mark = MARK_BAD;
            }
          } else if (isSelected) {
            stateClass = "choice--selected";
          }

          return (
            <li key={i}>
              <button
                type="button"
                className={`choice ${stateClass}`}
                onClick={() => onSelect(i)}
                disabled={disabled || revealed}
                aria-pressed={isSelected}
              >
                <span className="choice-letter">{LETTERS[i]}</span>
                <span className="choice-text">{choice}</span>
                {mark && (
                  <span className="choice-mark" aria-hidden="true">
                    {mark}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {revealed && (
        <div className={`feedback ${gotItRight ? "feedback--ok" : "feedback--bad"}`}>
          <p className="feedback-verdict label">
            <span aria-hidden="true">{gotItRight ? MARK_OK : MARK_BAD}</span>
            {gotItRight ? "Correct" : "Incorrect"}
          </p>
          <p className="feedback-explain">{question.explanation}</p>
          <a href={question.sourceUrl} target="_blank" rel="noreferrer">
            View source chapter
          </a>
        </div>
      )}
    </article>
  );
}
