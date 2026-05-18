import { ThemedText } from "@/components/themed-text";
import { Colors, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import type { Listing } from "@/types/listing";
import { Image } from "expo-image";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=200&q=80";

const THUMB_SIZE = 64;

interface WishlistRowCardProps {
  listing: Listing;
  onPress: (listing: Listing) => void;
}

export function WishlistRowCard({ listing, onPress }: WishlistRowCardProps) {
  const theme = useTheme();
  const imageUri = listing.photos?.[0]?.url ?? PLACEHOLDER_IMAGE;
  const subtitle = listing.location?.trim();

  return (
    <Pressable
      style={styles.row}
      onPress={() => onPress(listing)}
      accessibilityRole="button"
    >
      <View style={styles.imageWrap}>
        <Image
          source={{ uri: imageUri }}
          style={styles.thumbnail}
          contentFit="cover"
        />

        {/* Wishlist rows are always saved, so the heart must stay checked */}
        <ThemedText style={styles.heart}>♥</ThemedText>
        <ThemedText style={styles.checkeredOverlay}> </ThemedText>
      </View>

      <View style={styles.textBlock}>
        <ThemedText style={styles.title} numberOfLines={1}>
          {listing.title}
        </ThemedText>
        {subtitle ? (
          <ThemedText
            style={[styles.subtitle, { color: theme.textSecondary }]}
            numberOfLines={1}
          >
            {subtitle}
          </ThemedText>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    paddingVertical: Spacing.two,
  },
  imageWrap: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: Spacing.two,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  thumbnail: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: Spacing.two,
  },
  heart: {
    position: "absolute",
    right: Spacing.one,
    top: Spacing.one,
    fontSize: 18,
    color: Colors.light.primary,
    textShadowColor: "rgba(0,0,0,0.25)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  // keeps layout stable if you later swap to a checkered icon/image
  checkeredOverlay: {
    position: "absolute",
    right: Spacing.one,
    top: Spacing.one,
  },
  textBlock: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 22,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 18,
  },
});
