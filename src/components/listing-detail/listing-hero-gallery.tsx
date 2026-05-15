import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { Image } from "expo-image";
import { SymbolView } from "expo-symbols";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const HERO_HEIGHT = SCREEN_WIDTH * 0.72;
const PLACEHOLDER =
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80";

interface ListingHeroGalleryProps {
  photos: string[];
  isWishlisted: boolean;
  onBack: () => void;
  onShare: () => void;
  onWishlistPress: () => void;
}

export function ListingHeroGallery({
  photos,
  isWishlisted,
  onBack,
  onShare,
  onWishlistPress,
}: ListingHeroGalleryProps) {
  const insets = useSafeAreaInsets();
  const images = photos.length > 0 ? photos : [PLACEHOLDER];
  const [index, setIndex] = useState(0);

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    setIndex(Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH));
  }

  return (
    <View style={styles.wrap}>
      <FlatList
        data={images}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item }) => (
          <Image source={{ uri: item }} style={styles.image} contentFit="cover" />
        )}
      />

      <View style={[styles.topBar, { paddingTop: insets.top + Spacing.two }]}>
        <Pressable style={styles.circleBtn} onPress={onBack} hitSlop={8}>
          <SymbolView
            name={{ ios: "chevron.left", android: "arrow_back", web: "arrow_back" }}
            size={20}
            tintColor="#222"
          />
        </Pressable>
        <View style={styles.topRight}>
          <Pressable style={styles.circleBtn} onPress={onShare} hitSlop={8}>
            <SymbolView
              name={{ ios: "square.and.arrow.up", android: "share", web: "share" }}
              size={18}
              tintColor="#222"
            />
          </Pressable>
          <Pressable style={styles.circleBtn} onPress={onWishlistPress} hitSlop={8}>
            <ThemedText style={[styles.heart, isWishlisted && styles.heartOn]}>
              {isWishlisted ? "♥" : "♡"}
            </ThemedText>
          </Pressable>
        </View>
      </View>

      {images.length > 1 && (
        <View style={styles.counter}>
          <ThemedText style={styles.counterText}>
            {index + 1} / {images.length}
          </ThemedText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "relative", height: HERO_HEIGHT },
  image: { width: SCREEN_WIDTH, height: HERO_HEIGHT },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.three,
  },
  topRight: { flexDirection: "row", gap: Spacing.two },
  circleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
  },
  heart: { fontSize: 20, color: "#222" },
  heartOn: { color: "#FF385C" },
  counter: {
    position: "absolute",
    bottom: Spacing.three,
    right: Spacing.three,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  counterText: { color: "#fff", fontSize: 12, fontWeight: "600" },
});
