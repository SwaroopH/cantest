import { PROVINCES, getProvince, type ProvinceId } from "../lib/provinces";

type Props = {
  value: ProvinceId;
  onChange: (id: ProvinceId) => void;
};

export function ProvincePicker({ value, onChange }: Props) {
  const current = getProvince(value);

  return (
    <div className="province-bar">
      <div className="field">
        <label htmlFor="province-select" className="label">
          Your province or territory
        </label>
        <span className="field-wrap">
          <select
            id="province-select"
            value={value}
            onChange={(e) => onChange(e.target.value as ProvinceId)}
          >
            {PROVINCES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} (capital: {p.capital})
              </option>
            ))}
          </select>
        </span>
      </div>

      <p className="province-hint">
        Every mock exam includes at least one capital or region question for your selection —
        capital <span className="num">{current.capital}</span>. Preference is saved on this device.
      </p>
    </div>
  );
}
