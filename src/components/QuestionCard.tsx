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

export function QuestionCard({
  question,
  index,
  total,
  selected,
  onSelect,
  revealCorrect = false,
  disabled = false,
}: Props) {
  return (
    <article className="question-card">
      <header className="question-meta">
        <span>
          Question {index + 1} of {total}
        </span>
        <span className="chapter-chip">{chapterTitle(question.chapter)}</span>
      </header>
      <h2 className="question-prompt">{question.prompt}</h2>
      <ul className="choices">
        {question.choices.map((choice, i) => {
          const isSelected = selected === i;
          const isCorrect = i === question.correctIndex;
          let stateClass = "";
          if (revealCorrect && selected !== null) {
            if (isCorrect) stateClass = "choice-correct";
            else if (isSelected && !isCorrect) stateClass = "choice-wrong";
          } else if (isSelected) {
            stateClass = "choice-selected";
          }

          return (
            <li key={i}>
              <button
                type="button"
                className={`choice ${stateClass}`}
                onClick={() => onSelect(i)}
                disabled={disabled || (revealCorrect && selected !== null)}
                aria-pressed={isSelected}
              >
                <span className="choice-letter">{LETTERS[i]}</span>
                <span className="choice-text">{choice}</span>
              </button>
            </li>
          );
        })}
      </ul>
      {revealCorrect && selected !== null && (
        <div className={`feedback ${selected === question.correctIndex ? "ok" : "bad"}`}>
          <p className="feedback-verdict">
            {selected === question.correctIndex ? "Correct" : "Incorrect"}
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
