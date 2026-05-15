import { useTheme } from "@/hooks/use-theme";
import { StyleSheet, View } from "react-native";

export function SectionDivider() {
  const theme = useTheme();
  return <View style={[styles.divider, { backgroundColor: theme.border }]} />;
}

const styles = StyleSheet.create({
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 24,
  },
});
