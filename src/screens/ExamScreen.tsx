import { QuestionCard } from "../components/QuestionCard";
import { Timer } from "../components/Timer";
import type { Question } from "../types";

type Props = {
  mode: "mock" | "practice";
  questions: Question[];
  answers: (number | null)[];
  index: number;
  secondsLeft: number;
  onSelect: (choiceIndex: number) => void;
  onGoTo: (index: number) => void;
  onFinish: () => void;
};

export function ExamScreen({
  mode,
  questions,
  answers,
  index,
  secondsLeft,
  onSelect,
  onGoTo,
  onFinish,
}: Props) {
  const isPractice = mode === "practice";
  const answeredCount = answers.filter((a) => a !== null).length;
  const isLast = index === questions.length - 1;

  return (
    <>
      <div className="band band-inverse examtoolbar">
        <div className="band-inner band-inner--read examtoolbar-inner">
          {isPractice ? (
            <p className="label">Practice · untimed</p>
          ) : (
            <Timer secondsLeft={secondsLeft} />
          )}
          <p className="examtoolbar-count label">
            Answered <span className="num">{String(answeredCount).padStart(2, "0")}</span>
            {" / "}
            <span className="num">{questions.length}</span>
          </p>
        </div>
      </div>

      <main className="main main--read exam">
        <QuestionCard
          question={questions[index]}
          index={index}
          total={questions.length}
          selected={answers[index]}
          onSelect={onSelect}
          revealCorrect={isPractice}
        />

        <nav className="exam-nav">
          <button
            type="button"
            className="btn btn--ghost"
            disabled={index === 0}
            onClick={() => onGoTo(index - 1)}
          >
            Previous
          </button>
          {isLast ? (
            <button type="button" className="btn btn--primary" onClick={onFinish}>
              {isPractice ? "Finish practice" : "Submit exam"}
            </button>
          ) : (
            <button
              type="button"
              className="btn btn--primary"
              disabled={isPractice && answers[index] === null}
              onClick={() => onGoTo(index + 1)}
            >
              Next
            </button>
          )}
        </nav>

        <div className="ticketstrip-wrap">
          <div className="section-head">
            <h2>Progress</h2>
            <span className="label muted">
              {answeredCount} of {questions.length} answered
            </span>
          </div>

          <div className="ticketstrip" role="group" aria-label="Question navigator">
            {questions.map((_, i) => {
              const locked = isPractice && answers[i] === null && i > index;
              const classes = [
                "ticket",
                i === index ? "ticket--current" : "",
                answers[i] !== null ? "ticket--filled" : "",
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <button
                  key={i}
                  type="button"
                  className={classes}
                  disabled={locked}
                  onClick={() => onGoTo(i)}
                  aria-label={`Go to question ${i + 1}`}
                  aria-current={i === index ? "true" : undefined}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </div>
      </main>
    </>
  );
}
