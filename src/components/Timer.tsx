import { formatTime } from "../lib/exam";

type Props = {
  secondsLeft: number;
};

export function Timer({ secondsLeft }: Props) {
  const urgent = secondsLeft <= 60;
  const warn = !urgent && secondsLeft <= 5 * 60;
  const state = urgent ? "timer--urgent" : warn ? "timer--warn" : "";

  return (
    <div
      className={`timer ${state}`}
      role="timer"
      aria-live="polite"
      aria-label={`Time remaining ${formatTime(secondsLeft)}`}
    >
      <span className="timer-label label">Time left</span>
      <span className="timer-value">{formatTime(secondsLeft)}</span>
    </div>
  );
}
