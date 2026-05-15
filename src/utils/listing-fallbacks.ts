import type { ListingDetail, Review, ReviewsResponse } from "@/types/listing";

/** City → approximate coordinates for map when API has no lat/lng */
const CITY_COORDS: Record<string, { latitude: number; longitude: number }> = {
  "cape town": { latitude: -33.9249, longitude: 18.4241 },
  lagos: { latitude: 6.5244, longitude: 3.3792 },
  kigali: { latitude: -1.9403, longitude: 30.0588 },
  nairobi: { latitude: -1.2921, longitude: 36.8219 },
  nantes: { latitude: 47.2184, longitude: -1.5536 },
  paris: { latitude: 48.8566, longitude: 2.3522 },
  london: { latitude: 51.5074, longitude: -0.1278 },
  "new york": { latitude: 40.7128, longitude: -74.006 },
};

const REVIEW_SNIPPETS = [
  "Wonderful stay — clean, quiet, and exactly as described. Would book again.",
  "Great location and responsive host. The room was comfortable and well equipped.",
  "Perfect for a short trip. Check-in was smooth and the neighborhood is lovely.",
  "Lovely place! Everything we needed was there. Highly recommend.",
  "Beautiful space and thoughtful touches. Felt right at home.",
];

const REVIEWER_NAMES = ["Emma", "James", "Sophie", "Lucas", "Mia", "Noah"];

export function resolveCoordinates(listing: ListingDetail): {
  latitude: number;
  longitude: number;
} | null {
  if (
    listing.latitude != null &&
    listing.longitude != null &&
    !Number.isNaN(listing.latitude) &&
    !Number.isNaN(listing.longitude)
  ) {
    return { latitude: listing.latitude, longitude: listing.longitude };
  }
  const key = listing.location.trim().toLowerCase();
  const direct = CITY_COORDS[key];
  if (direct) return direct;
  for (const [city, coords] of Object.entries(CITY_COORDS)) {
    if (key.includes(city)) return coords;
  }
  return null;
}

export function generateFallbackReviews(
  listing: ListingDetail,
  count = 5,
): ReviewsResponse {
  const baseRating = listing.rating ?? 4.8;
  const total = listing.reviewCount ?? 12;
  const data: Review[] = Array.from({ length: Math.min(count, total) }, (_, i) => {
    const weeksAgo = (i + 1) * 2;
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - weeksAgo * 7);
    return {
      id: `fallback-${listing.id}-${i}`,
      rating: Math.min(5, Math.max(4, Math.round(baseRating))),
      comment: REVIEW_SNIPPETS[i % REVIEW_SNIPPETS.length],
      createdAt: createdAt.toISOString(),
      author: {
        name: REVIEWER_NAMES[i % REVIEWER_NAMES.length],
        avatar: null,
      },
    };
  });
  return {
    data,
    meta: {
      total,
      averageRating: baseRating,
    },
  };
}

export function formatRelativeDate(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const days = Math.floor((now - then) / (1000 * 60 * 60 * 24));
  if (days < 1) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;
  const years = Math.floor(days / 365);
  return `${years} year${years === 1 ? "" : "s"} ago`;
}
