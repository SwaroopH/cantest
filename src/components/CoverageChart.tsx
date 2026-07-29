import { delay, ratioToPct } from "../lib/css";

export type CoverageRow = {
  id: string;
  title: string;
  count: number;
};

type Props = {
  rows: CoverageRow[];
};

export function CoverageChart({ rows }: Props) {
  const max = Math.max(1, ...rows.map((r) => r.count));

  return (
    <section className="coverage">
      <div className="section-head">
        <h2>Coverage</h2>
        <span className="label muted">
          {rows.length} chapters in scope
        </span>
      </div>

      <ul>
        {rows.map((row, i) => (
          <li className="coverage-row" key={row.id}>
            <span className="coverage-name label" title={row.title}>
              {row.title}
            </span>
            <span className="coverage-bar" aria-hidden="true">
              <span style={{ width: ratioToPct(row.count / max), ...delay(i * 40) }} />
            </span>
            <span className="coverage-count num">{row.count}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
