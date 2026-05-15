import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

interface DescriptionSectionProps {
  description: string;
}

export function DescriptionSection({ description }: DescriptionSectionProps) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const preview =
    description.length > 180 && !expanded
      ? `${description.slice(0, 180).trim()}…`
      : description;

  return (
    <View style={styles.wrap}>
      <ThemedText style={styles.body}>{preview}</ThemedText>
      {description.length > 180 && (
        <Pressable onPress={() => setExpanded((e) => !e)}>
          <ThemedText style={[styles.more, { color: theme.text }]}>
            {expanded ? "Show less" : "Show more ›"}
          </ThemedText>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: Spacing.four, gap: Spacing.two },
  body: { fontSize: 15, lineHeight: 22 },
  more: { fontSize: 15, fontWeight: "600", textDecorationLine: "underline" },
});
