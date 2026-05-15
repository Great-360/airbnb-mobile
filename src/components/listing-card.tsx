import { ThemedText } from "@/components/themed-text";
import { Colors, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { Image } from "expo-image";
import React, { useState } from "react";
import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

import type { Listing, ListingPhoto } from "@/types/listing";

export type { Listing, ListingPhoto };

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_HORIZONTAL_MARGIN = Spacing.four;
const IMAGE_WIDTH = SCREEN_WIDTH - CARD_HORIZONTAL_MARGIN * 2;
const IMAGE_HEIGHT = IMAGE_WIDTH * 0.75;
// Fallback when a listing has no uploaded photos yet
const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80";

interface ListingCardProps {
  listing: Listing;
  onPress: (listing: Listing) => void;
  onWishlistPress: (listing: Listing) => void;
  isWishlisted: boolean;
}

export function ListingCard({
  listing,
  onPress,
  onWishlistPress,
  isWishlisted,
}: ListingCardProps) {
  const theme = useTheme();

  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  const photos = listing.photos ?? [];
  const images =
    photos.length > 0 ? photos.map((p) => p.url) : [PLACEHOLDER_IMAGE];

  function handlePhotoScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const index = Math.round(e.nativeEvent.contentOffset.x / IMAGE_WIDTH);
    setActivePhotoIndex(index);
  }

  return (
    <Pressable
      style={[styles.card, { marginHorizontal: CARD_HORIZONTAL_MARGIN }]}
      onPress={() => onPress(listing)}
    >
      <View style={styles.imageContainer}>
        <FlatList
          data={images}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handlePhotoScroll}
          scrollEventThrottle={16}
          keyExtractor={(_, i) => String(i)}
          renderItem={({ item }) => (
            <Image
              source={{ uri: item }}
              style={styles.image}
              contentFit="cover"
            />
          )}
        />

        {/* Heart button */}
        <Pressable
          style={styles.heartButton}
          onPress={() => onWishlistPress(listing)}
          hitSlop={8}
        >
          <ThemedText
            style={[styles.heartIcon, isWishlisted && styles.heartActive]}
          >
            {isWishlisted ? "♥" : "♡"}
          </ThemedText>
        </Pressable>

        {images.length > 1 && (
          <View style={styles.dotsRow}>
            {images.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i === activePhotoIndex && styles.dotActive]}
              />
            ))}
          </View>
        )}
      </View>

      <View style={styles.infoRow}>
        <View style={styles.infoLeft}>
          <ThemedText style={styles.location} numberOfLines={1}>
            {listing.location}
          </ThemedText>

          <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
            {capitalize(listing.type)} · {listing.guests} guests
          </ThemedText>

          <ThemedText style={styles.price}>
            <ThemedText style={styles.priceBold}>
              ${listing.pricePerNight.toLocaleString()}
            </ThemedText>{" "}
            <ThemedText
              style={[styles.priceLabel, { color: theme.textSecondary }]}
            >
              night
            </ThemedText>
          </ThemedText>
        </View>

        {listing.rating !== null && (
          <View style={styles.ratingRow}>
            <ThemedText style={styles.ratingStar}>★</ThemedText>
            <ThemedText style={styles.ratingValue}>
              {listing.rating.toFixed(2)}
            </ThemedText>
          </View>
        )}
      </View>
    </Pressable>
  );
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.five,
  },

  // Image area
  imageContainer: {
    borderRadius: Spacing.three,
    overflow: "hidden",
    position: "relative",
  },
  image: {
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
  },

  // Heart button
  heartButton: {
    position: "absolute",
    top: Spacing.two,
    right: Spacing.two,
    padding: Spacing.one,
  },
  heartIcon: {
    fontSize: 22,
    color: "#fff",
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  heartActive: {
    color: Colors.light.primary,
  },

  dotsRow: {
    position: "absolute",
    bottom: Spacing.two,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.one,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.6)",
  },
  dotActive: {
    backgroundColor: "#fff",
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // Text info
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: Spacing.two,
  },
  infoLeft: {
    flex: 1,
    gap: 2,
    paddingRight: Spacing.two,
  },
  location: {
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 20,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 18,
  },
  price: {
    marginTop: 2,
    fontSize: 14,
    lineHeight: 20,
  },
  priceBold: {
    fontWeight: "600",
    fontSize: 14,
  },
  priceLabel: {
    fontSize: 14,
    fontWeight: "400",
  },

  // Rating
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingTop: 2,
  },
  ratingStar: {
    fontSize: 13,
  },
  ratingValue: {
    fontSize: 13,
    fontWeight: "500",
  },
});
