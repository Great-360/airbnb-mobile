import { SymbolView } from "expo-symbols";
import { useTheme } from "@/hooks/use-theme";

const AMENITY_ICONS = {
  wifi: { ios: "wifi", android: "wifi", web: "wifi" },
  pool: { ios: "drop.fill", android: "pool", web: "pool" },
  tv: { ios: "tv", android: "tv", web: "tv" },
  parking: { ios: "car.fill", android: "local_parking", web: "local_parking" },
  heating: { ios: "flame.fill", android: "whatshot", web: "whatshot" },
  washer: { ios: "washer.fill", android: "local_laundry_service", web: "local_laundry_service" },
  dryer: { ios: "dryer.fill", android: "local_laundry_service", web: "local_laundry_service" },
  workspace: { ios: "laptopcomputer", android: "laptop", web: "laptop" },
  "air conditioning": { ios: "snowflake", android: "ac_unit", web: "ac_unit" },
} as const;

const DEFAULT_ICON = {
  ios: "checkmark.circle",
  android: "check_circle",
  web: "check_circle",
} as const;

export function AmenityIcon({ name, size = 24 }: { name: string; size?: number }) {
  const theme = useTheme();
  const key = name.toLowerCase();
  const icon =
    Object.entries(AMENITY_ICONS).find(([k]) => key.includes(k))?.[1] ??
    DEFAULT_ICON;
  return (
    <SymbolView
      name={icon as Parameters<typeof SymbolView>[0]["name"]}
      size={size}
      tintColor={theme.text}
    />
  );
}
