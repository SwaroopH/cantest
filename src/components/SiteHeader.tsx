import { ratioToPct } from "../lib/css";
import { GitHubBanner } from "./GitHubBanner";

type Props = {
  onHome: () => void;
  shortLabel: string;
  /**
   * 0–1. When provided, the 3px band closing the masthead becomes a live
   * progress fill instead of a plain marigold rule — same height either way,
   * so the sticky exam toolbar can always offset by a fixed --masthead-h.
   */
  progress?: number;
};

export function SiteHeader({ onHome, shortLabel, progress }: Props) {
  return (
    <header className="band band-inverse masthead">
      <GitHubBanner />
      <div className="band-inner masthead-inner">
        <button type="button" className="brand" onClick={onHome}>
          <span className="brand-word">CanTest</span>
        </button>
        <span className="chip chip--marigold">{shortLabel}</span>
      </div>

      {progress === undefined ? (
        <div className="masthead-edge" />
      ) : (
        <div className="masthead-edge masthead-edge--track" aria-hidden="true">
          <span style={{ width: ratioToPct(progress) }} />
        </div>
      )}
    </header>
  );
}
