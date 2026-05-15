import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { Platform, StyleSheet, View } from "react-native";

interface LocationMapSectionProps {
  coords: { latitude: number; longitude: number } | null;
  location: string;
}

export function LocationMapSection({ coords, location }: LocationMapSectionProps) {
  const theme = useTheme();

  if (Platform.OS !== "web" && coords) {
    try {
      const Maps = require("react-native-maps");
      const MapView = Maps.default ?? Maps;
      const { Marker, Circle } = Maps;
      const region = {
        latitude: coords.latitude,
        longitude: coords.longitude,
        latitudeDelta: 0.04,
        longitudeDelta: 0.04,
      };

      return (
        <View style={styles.wrap}>
          <ThemedText style={styles.heading}>Where you&apos;ll be</ThemedText>
          <View style={[styles.mapWrap, { borderColor: theme.border }]}>
            <MapView
              style={styles.map}
              region={region}
              scrollEnabled={false}
              zoomEnabled={false}
              rotateEnabled={false}
              pitchEnabled={false}
            >
              <Circle
                center={coords}
                radius={500}
                fillColor="rgba(255, 56, 92, 0.15)"
                strokeColor="rgba(255, 56, 92, 0.35)"
                strokeWidth={1}
              />
              <Marker coordinate={coords} />
            </MapView>
          </View>
          <ThemedText style={styles.locationBold}>{location}</ThemedText>
          <ThemedText
            style={[styles.neighborhood, { color: theme.textSecondary }]}
          >
            This neighborhood is loved by guests for its walkability, local
            cafés, and easy access to transit.
          </ThemedText>
          <ThemedText style={styles.showMore}>Show more ›</ThemedText>
        </View>
      );
    } catch {
      /* maps package not installed — fall through */
    }
  }

  return (
    <View style={styles.wrap}>
      <ThemedText style={styles.heading}>Where you&apos;ll be</ThemedText>
      <View style={[styles.mapPlaceholder, { borderColor: theme.border }]}>
        <ThemedText style={{ color: theme.textSecondary }}>
          {coords
            ? Platform.OS === "web"
              ? "Map available in the iOS/Android app"
              : "Run npm install, then npx expo run:ios or run:android for maps"
            : "Location approximate"}
        </ThemedText>
      </View>
      <ThemedText style={styles.locationBold}>{location}</ThemedText>
      <ThemedText style={[styles.neighborhood, { color: theme.textSecondary }]}>
        Explore the area around {location} — restaurants, parks, and local
        highlights are within easy reach.
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: Spacing.four, gap: Spacing.three },
  heading: { fontSize: 20, fontWeight: "700" },
  mapWrap: {
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    height: 280,
  },
  map: { width: "100%", height: "100%" },
  mapPlaceholder: {
    height: 200,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F7F7F7",
    paddingHorizontal: Spacing.three,
  },
  locationBold: { fontSize: 16, fontWeight: "700" },
  neighborhood: { fontSize: 14, lineHeight: 20 },
  showMore: { fontSize: 14, fontWeight: "600", textDecorationLine: "underline" },
});
