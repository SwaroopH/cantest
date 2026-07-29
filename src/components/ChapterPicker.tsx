import { CHAPTERS } from "../lib/exam";

type Props = {
  value: string | "all";
  onChange: (value: string | "all") => void;
  counts: Record<string, number>;
};

export function ChapterPicker({ value, onChange, counts }: Props) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="field">
      <label htmlFor="chapter-select" className="label">
        Chapter
      </label>
      <span className="field-wrap">
        <select
          id="chapter-select"
          value={value}
          onChange={(e) => onChange(e.target.value as string | "all")}
        >
          <option value="all">All chapters ({total})</option>
          {CHAPTERS.map((c) => (
            <option key={c.id} value={c.id} disabled={!counts[c.id]}>
              {c.title} ({counts[c.id] ?? 0})
            </option>
          ))}
        </select>
      </span>
    </div>
  );
}
