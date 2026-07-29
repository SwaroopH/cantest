import { PROVINCES, type ProvinceId } from "../lib/provinces";

type Props = {
  value: ProvinceId;
  onChange: (id: ProvinceId) => void;
};

export function ProvincePicker({ value, onChange }: Props) {
  return (
    <div className="province-picker">
      <label htmlFor="province-select">Your province or territory</label>
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
      <p className="province-hint">
        Mock exams include capital and region questions for your selection. Preference is saved on
        this device.
      </p>
    </div>
  );
}
