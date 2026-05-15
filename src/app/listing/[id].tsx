import { getListing, getListingReviews } from "@/api/listings";
import { AirCoverSection } from "@/components/listing-detail/aircover-section";
import { AmenitiesSection } from "@/components/listing-detail/amenities-section";
import { DescriptionSection } from "@/components/listing-detail/description-section";
import { FooterLinks } from "@/components/listing-detail/footer-links";
import { HighlightsSection } from "@/components/listing-detail/highlight-row";
import { HostRow } from "@/components/listing-detail/host-row";
import { ListingBottomBar } from "@/components/listing-detail/listing-bottom-bar";
import { ListingHeader } from "@/components/listing-detail/listing-header";
import { ListingHeroGallery } from "@/components/listing-detail/listing-hero-gallery";
import {
  AmenitiesModalContent,
  ListModal,
  ReviewsModalContent,
} from "@/components/listing-detail/list-modal";
import { LocationMapSection } from "@/components/listing-detail/location-map";
import { ReviewsSection } from "@/components/listing-detail/reviews-section";
import { SectionDivider } from "@/components/listing-detail/section-divider";
import { SleepingCarousel } from "@/components/listing-detail/sleeping-carousel";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { API_BASE_URL } from "@/constants/api";
import { Colors, Spacing } from "@/constants/theme";
import type { ListingDetail, ReviewsResponse } from "@/types/listing";
import { resolveCoordinates } from "@/utils/listing-fallbacks";
import { authHeaders } from "@/store/auth-store";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);

  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [reviews, setReviews] = useState<ReviewsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [amenitiesOpen, setAmenitiesOpen] = useState(false);
  const [reviewsOpen, setReviewsOpen] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const detail = await getListing(id);
      const reviewsData = await getListingReviews(detail);
      setListing(detail);
      setReviews(reviewsData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load listing");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    async function checkWishlist() {
      if (!id) return;
      try {
        const headers = await authHeaders();
        if (!("Authorization" in headers)) return;
        const res = await fetch(`${API_BASE_URL}/wishlists/ids`, { headers });
        if (!res.ok) return;
        const json = await res.json();
        setIsWishlisted((json.ids as string[]).includes(id));
      } catch {
        /* ignore */
      }
    }
    checkWishlist();
  }, [id]);

  async function handleWishlistToggle() {
    if (!listing) return;
    const wasSaved = isWishlisted;
    setIsWishlisted(!wasSaved);

    try {
      const headers = await authHeaders();
      if (!("Authorization" in headers)) {
        setIsWishlisted(wasSaved);
        Toast.show({
          type: "error",
          text1: "Please log in to save listings",
          position: "bottom",
        });
        return;
      }
      const res = await fetch(`${API_BASE_URL}/wishlists/${listing.id}`, {
        method: wasSaved ? "DELETE" : "POST",
        headers,
      });
      if (!res.ok) {
        setIsWishlisted(wasSaved);
        Toast.show({ type: "error", text1: "Failed to update wishlist" });
      } else {
        Toast.show({
          type: wasSaved ? "info" : "success",
          text1: wasSaved ? "Removed from wishlist" : "Added to wishlist",
        });
      }
    } catch {
      setIsWishlisted(wasSaved);
      Toast.show({ type: "error", text1: "Network error" });
    }
  }

  function handleShare() {
    if (!listing) return;
    Share.share({
      message: `Check out ${listing.title} on Airbnb — $${listing.pricePerNight}/night in ${listing.location}`,
    });
  }

  function scrollToReviews() {
    scrollRef.current?.scrollTo({ y: 2200, animated: true });
  }

  if (isLoading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </ThemedView>
    );
  }

  if (error || !listing) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText style={styles.errorTitle}>Couldn&apos;t load listing</ThemedText>
        <ThemedText style={styles.errorBody}>{error ?? "Unknown error"}</ThemedText>
        <Pressable
          style={[styles.retry, { backgroundColor: Colors.light.primary }]}
          onPress={load}
        >
          <ThemedText style={styles.retryText}>Try again</ThemedText>
        </Pressable>
        <Pressable onPress={() => router.back()}>
          <ThemedText style={styles.backLink}>Go back</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  const photos = listing.photos.map((p) => p.url);
  const coords = resolveCoordinates(listing);
  const reviewMeta = reviews?.meta ?? {
    total: 0,
    averageRating: listing.rating ?? 0,
  };
  const reviewList = reviews?.data ?? [];

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <ListingHeroGallery
          photos={photos}
          isWishlisted={isWishlisted}
          onBack={() => router.back()}
          onShare={handleShare}
          onWishlistPress={handleWishlistToggle}
        />

        <ListingHeader
          title={listing.title}
          rating={listing.rating}
          reviewCount={reviewMeta.total}
          location={listing.location}
          onReviewsPress={scrollToReviews}
        />

        <HostRow host={listing.host} listingType={listing.type} />
        <SectionDivider />

        <HighlightsSection />
        <SectionDivider />

        <AirCoverSection />
        <SectionDivider />

        <DescriptionSection description={listing.description} />
        <SectionDivider />

        <SleepingCarousel guests={listing.guests} type={listing.type} />
        <SectionDivider />

        <AmenitiesSection
          amenities={listing.amenities}
          onShowAll={() => setAmenitiesOpen(true)}
        />
        <SectionDivider />

        <LocationMapSection coords={coords} location={listing.location} />
        <SectionDivider />

        <ReviewsSection
          reviews={reviewList}
          averageRating={reviewMeta.averageRating}
          total={reviewMeta.total}
          onShowAll={() => setReviewsOpen(true)}
        />
        <SectionDivider />

        <FooterLinks />
        <View style={{ height: 100 }} />
      </ScrollView>

      <ListingBottomBar
        pricePerNight={listing.pricePerNight}
        onReserve={() =>
          Toast.show({
            type: "info",
            text1: "Booking coming soon",
            text2: "Select dates on the next release.",
          })
        }
      />

      <ListModal
        visible={amenitiesOpen}
        title="Amenities"
        onClose={() => setAmenitiesOpen(false)}
      >
        <AmenitiesModalContent amenities={listing.amenities} />
      </ListModal>

      <ListModal
        visible={reviewsOpen}
        title={`${reviewMeta.total} reviews`}
        onClose={() => setReviewsOpen(false)}
      >
        <ReviewsModalContent reviews={reviewList} />
      </ListModal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingBottom: Spacing.four },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.three,
    padding: Spacing.five,
  },
  errorTitle: { fontSize: 18, fontWeight: "600" },
  errorBody: { textAlign: "center", opacity: 0.7 },
  retry: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: 24,
    marginTop: Spacing.two,
  },
  retryText: { color: "#fff", fontWeight: "600" },
  backLink: { marginTop: Spacing.two, textDecorationLine: "underline" },
});
