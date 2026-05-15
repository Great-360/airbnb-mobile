import { API_BASE_URL } from "@/constants/api";
import type { ListingDetail, ReviewsResponse } from "@/types/listing";
import { generateFallbackReviews } from "@/utils/listing-fallbacks";

const SENSITIVE_HOST_KEYS = [
  "password",
  "resetToken",
  "resetTokenExpiry",
  "email",
  "phone",
  "username",
  "role",
  "createdAt",
  "updatedAt",
  "avatarPublicId",
] as const;

function sanitizeHost(raw: Record<string, unknown> | null | undefined) {
  if (!raw || typeof raw !== "object") {
    return { name: "Host", avatar: null as string | null };
  }
  return {
    id: typeof raw.id === "string" ? raw.id : undefined,
    name: typeof raw.name === "string" ? raw.name : "Host",
    avatar:
      typeof raw.avatar === "string"
        ? raw.avatar
        : typeof raw.avatarUrl === "string"
          ? raw.avatarUrl
          : null,
    isSuperhost: Boolean(raw.isSuperhost),
    hostingSince:
      typeof raw.hostingSince === "string" ? raw.hostingSince : undefined,
  };
}

function normalizeListing(raw: Record<string, unknown>): ListingDetail {
  const host = sanitizeHost(
    raw.host as Record<string, unknown> | undefined,
  );
  const photos = Array.isArray(raw.photos) ? raw.photos : [];
  return {
    id: String(raw.id ?? ""),
    title: String(raw.title ?? ""),
    description: String(raw.description ?? ""),
    location: String(raw.location ?? ""),
    pricePerNight: Number(raw.pricePerNight ?? 0),
    guests: Number(raw.guests ?? 1),
    type: (raw.type as ListingDetail["type"]) ?? "APARTMENT",
    amenities: Array.isArray(raw.amenities)
      ? (raw.amenities as string[])
      : [],
    rating: raw.rating != null ? Number(raw.rating) : null,
    photos: photos as ListingDetail["photos"],
    host,
    latitude:
      raw.latitude != null ? Number(raw.latitude) : null,
    longitude:
      raw.longitude != null ? Number(raw.longitude) : null,
    reviewCount:
      raw.reviewCount != null ? Number(raw.reviewCount) : undefined,
    bedrooms: Array.isArray(raw.bedrooms)
      ? (raw.bedrooms as ListingDetail["bedrooms"])
      : undefined,
  };
}

export async function getListing(id: string): Promise<ListingDetail> {
  const res = await fetch(`${API_BASE_URL}/listings/${id}`);
  if (!res.ok) {
    throw new Error(`Failed to load listing (${res.status})`);
  }
  const json = await res.json();
  const raw = json.data ?? json;
  return normalizeListing(raw as Record<string, unknown>);
}

export async function getListingReviews(
  listing: ListingDetail,
): Promise<ReviewsResponse> {
  try {
    const res = await fetch(
      `${API_BASE_URL}/listings/${listing.id}/reviews`,
    );
    if (!res.ok) {
      return generateFallbackReviews(listing);
    }
    const json = await res.json();
    const data = Array.isArray(json.data) ? json.data : [];
    const meta = json.meta ?? {};
    return {
      data,
      meta: {
        total: Number(meta.total ?? data.length),
        averageRating: Number(
          meta.averageRating ?? listing.rating ?? 0,
        ),
      },
    };
  } catch {
    return generateFallbackReviews(listing);
  }
}

export async function searchListings(params?: {
  type?: string;
}): Promise<ListingDetail[]> {
  const searchParams = new URLSearchParams();
  if (params?.type) searchParams.append("type", params.type);
  const qs = searchParams.toString();
  const res = await fetch(
    `${API_BASE_URL}/listings/search${qs ? `?${qs}` : ""}`,
  );
  if (!res.ok) throw new Error(`Server error: ${res.status}`);
  const json = await res.json();
  const items = Array.isArray(json.data) ? json.data : [];
  return items.map((item: Record<string, unknown>) =>
    normalizeListing(item),
  );
}
