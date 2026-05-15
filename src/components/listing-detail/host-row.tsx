import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import type { ListingHost } from "@/types/listing";
import { useTheme } from "@/hooks/use-theme";
import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";

interface HostRowProps {
  host: ListingHost;
  listingType: string;
}

export function HostRow({ host, listingType }: HostRowProps) {
  const theme = useTheme();
  const typeLabel = listingType.charAt(0) + listingType.slice(1).toLowerCase();
  const hostingLabel = host.isSuperhost
    ? "Superhost · 1 year hosting"
    : "Host · 1 year hosting";

  return (
    <View style={styles.wrap}>
      <View style={styles.textCol}>
        <ThemedText style={styles.title}>
          {typeLabel} hosted by {host.name}
        </ThemedText>
        <ThemedText style={[styles.sub, { color: theme.textSecondary }]}>
          {hostingLabel}
        </ThemedText>
      </View>
      {host.avatar ? (
        <Image source={{ uri: host.avatar }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <ThemedText style={styles.initial}>
            {host.name.charAt(0).toUpperCase()}
          </ThemedText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  textCol: { flex: 1, paddingRight: Spacing.three, gap: 4 },
  title: { fontSize: 16, fontWeight: "600", lineHeight: 22 },
  sub: { fontSize: 14 },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarPlaceholder: {
    backgroundColor: "#DDDDDD",
    alignItems: "center",
    justifyContent: "center",
  },
  initial: { fontSize: 20, fontWeight: "600" },
});
