export type Stat = {
  value: string | number;
  label: string;
};

type Props = {
  stats: Stat[];
};

export function StatRail({ stats }: Props) {
  return (
    <dl className="statrail">
      {stats.map((stat) => (
        <div className="statrail-cell" key={stat.label}>
          <dt className="statrail-label label">{stat.label}</dt>
          <dd className="statrail-value num">{stat.value}</dd>
        </div>
      ))}
    </dl>
  );
}
