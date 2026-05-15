import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { SymbolView } from "expo-symbols";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

function FooterRow({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <Pressable
      style={[styles.row, { borderBottomColor: theme.border }]}
      onPress={() => setOpen((o) => !o)}
    >
      <View style={styles.rowHeader}>
        <ThemedText style={styles.rowTitle}>{title}</ThemedText>
        <SymbolView
          name={{
            ios: open ? "chevron.up" : "chevron.right",
            android: open ? "expand_less" : "chevron_right",
            web: open ? "expand_less" : "chevron_right",
          }}
          size={18}
          tintColor={theme.text}
        />
      </View>
      {open && children ? <View style={styles.rowBody}>{children}</View> : null}
    </Pressable>
  );
}

export function FooterLinks() {
  const theme = useTheme();

  return (
    <View style={styles.wrap}>
      <FooterRow title="Availability">
        <ThemedText style={[styles.body, { color: theme.textSecondary }]}>
          Jun 25 – 30
        </ThemedText>
      </FooterRow>
      <FooterRow title="Cancellation policy">
        <ThemedText style={[styles.body, { color: theme.textSecondary }]}>
          Free cancellation before Jun 21. After that, cancel before check-in for
          a partial refund.
        </ThemedText>
      </FooterRow>
      <FooterRow title="House rules">
        <ThemedText style={styles.bullet}>· Check-in after 3:00 PM</ThemedText>
        <ThemedText style={styles.bullet}>· Checkout before 11:00 AM</ThemedText>
        <ThemedText style={styles.bullet}>· No smoking</ThemedText>
        <ThemedText style={styles.link}>Show more</ThemedText>
      </FooterRow>
      <FooterRow title="Safety & property">
        <ThemedText style={styles.bullet}>· Smoke alarm</ThemedText>
        <ThemedText style={styles.bullet}>· Carbon monoxide alarm</ThemedText>
        <ThemedText style={styles.link}>Show more</ThemedText>
      </FooterRow>
      <Pressable style={styles.report}>
        <SymbolView
          name={{ ios: "flag", android: "flag", web: "flag" }}
          size={14}
          tintColor={theme.textSecondary}
        />
        <ThemedText style={[styles.reportText, { color: theme.textSecondary }]}>
          Report this listing
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: Spacing.four },
  row: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: Spacing.three,
  },
  rowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowTitle: { fontSize: 16, fontWeight: "600" },
  rowBody: { marginTop: Spacing.two, gap: Spacing.one },
  body: { fontSize: 14, lineHeight: 20 },
  bullet: { fontSize: 14, lineHeight: 22 },
  link: {
    fontSize: 14,
    fontWeight: "600",
    textDecorationLine: "underline",
    marginTop: Spacing.one,
  },
  report: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    paddingVertical: Spacing.four,
  },
  reportText: { fontSize: 14, textDecorationLine: "underline" },
});
