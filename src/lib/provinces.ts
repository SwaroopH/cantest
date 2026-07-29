export type ProvinceId =
  | "nl"
  | "pe"
  | "ns"
  | "nb"
  | "qc"
  | "on"
  | "mb"
  | "sk"
  | "ab"
  | "bc"
  | "yt"
  | "nt"
  | "nu";

export type Province = {
  id: ProvinceId;
  name: string;
  capital: string;
  shortLabel: string;
};

export const DEFAULT_PROVINCE: ProvinceId = "bc";

export const PROVINCES: Province[] = [
  { id: "nl", name: "Newfoundland and Labrador", capital: "St. John’s", shortLabel: "NL" },
  { id: "pe", name: "Prince Edward Island", capital: "Charlottetown", shortLabel: "PE" },
  { id: "ns", name: "Nova Scotia", capital: "Halifax", shortLabel: "NS" },
  { id: "nb", name: "New Brunswick", capital: "Fredericton", shortLabel: "NB" },
  { id: "qc", name: "Quebec", capital: "Québec City", shortLabel: "QC" },
  { id: "on", name: "Ontario", capital: "Toronto", shortLabel: "ON" },
  { id: "mb", name: "Manitoba", capital: "Winnipeg", shortLabel: "MB" },
  { id: "sk", name: "Saskatchewan", capital: "Regina", shortLabel: "SK" },
  { id: "ab", name: "Alberta", capital: "Edmonton", shortLabel: "AB" },
  { id: "bc", name: "British Columbia", capital: "Victoria", shortLabel: "BC" },
  { id: "yt", name: "Yukon", capital: "Whitehorse", shortLabel: "YT" },
  { id: "nt", name: "Northwest Territories", capital: "Yellowknife", shortLabel: "NT" },
  { id: "nu", name: "Nunavut", capital: "Iqaluit", shortLabel: "NU" },
];

export function isProvinceId(value: string): value is ProvinceId {
  return PROVINCES.some((p) => p.id === value);
}

export function getProvince(id: ProvinceId): Province {
  switch (id) {
    case "nl":
    case "pe":
    case "ns":
    case "nb":
    case "qc":
    case "on":
    case "mb":
    case "sk":
    case "ab":
    case "bc":
    case "yt":
    case "nt":
    case "nu": {
      const found = PROVINCES.find((p) => p.id === id);
      if (!found) throw new Error(`Missing province entry: ${id}`);
      return found;
    }
    default: {
      const _exhaustive: never = id;
      throw new Error(`Unknown province: ${_exhaustive}`);
    }
  }
}
