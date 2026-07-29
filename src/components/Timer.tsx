import { formatTime } from "../lib/exam";

type Props = {
  secondsLeft: number;
  totalSeconds: number;
};

export function Timer({ secondsLeft, totalSeconds }: Props) {
  const urgent = secondsLeft <= 60;
  const warn = !urgent && secondsLeft <= 5 * 60;
  const pct = totalSeconds > 0 ? (secondsLeft / totalSeconds) * 100 : 0;

  return (
    <div
      className={`timer ${urgent ? "timer-urgent" : warn ? "timer-warn" : ""}`}
      role="timer"
      aria-live="polite"
      aria-label={`Time remaining ${formatTime(secondsLeft)}`}
    >
      <span className="timer-label">Time left</span>
      <span className="timer-value">{formatTime(secondsLeft)}</span>
      <div className="timer-bar" aria-hidden="true">
        <div className="timer-bar-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
