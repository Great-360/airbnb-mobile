import { API_BASE_URL } from "@/constants/api";
import { authHeaders } from "@/store/auth-store";
import type { Booking } from "@/types/booking";

function asBooking(raw: any): Booking {
  // Keep this mapping intentionally lenient since backend response shape
  // may differ slightly between environments.
  const listingId = String(raw?.listingId ?? raw?.listing_id ?? "");
  const id = String(raw?.id ?? raw?.bookingId ?? "");

  return {
    id,
    listingId,
    startDate: raw?.checkIn ?? raw?.startDate ?? raw?.start_date,
    endDate: raw?.checkOut ?? raw?.endDate ?? raw?.end_date,
    guests: raw?.guests ?? raw?.guestCount ?? raw?.guest_count,
    status:
      typeof raw?.status === "string"
        ? raw.status.trim().toUpperCase()
        : undefined,
    totalPrice: raw?.totalPrice ?? raw?.total_price,
    currency: raw?.currency ?? raw?.currencyCode,
    createdAt: raw?.createdAt ?? raw?.created_at,
    listing: raw?.listing
      ? {
          id: String(raw.listing.id ?? ""),
          title:
            typeof raw.listing.title === "string"
              ? raw.listing.title
              : undefined,
          location:
            typeof raw.listing.location === "string"
              ? raw.listing.location
              : undefined,
          coverUrl:
            typeof raw.listing.coverUrl === "string"
              ? raw.listing.coverUrl
              : typeof raw.listing.cover_url === "string"
                ? raw.listing.cover_url
                : undefined,
        }
      : undefined,
  };
}

export async function getHostBookings(params?: {
  status?: string;
  page?: number;
  limit?: number;
}): Promise<Booking[]> {
  const headers = await authHeaders();
  const qs = new URLSearchParams();
  if (params?.status) qs.set("status", params.status);
  if (params?.page != null) qs.set("page", String(params.page));
  if (params?.limit != null) qs.set("limit", String(params.limit));

  const url = `${API_BASE_URL}/bookings/host${qs.toString() ? `?${qs}` : ""}`;

  const res = await fetch(url, { headers });
  if (!res.ok) {
    const json = await res.json().catch(() => null);
    const message =
      typeof json?.error === "string"
        ? json.error
        : typeof json?.message === "string"
          ? json.message
          : `Request failed (${res.status})`;
    throw new Error(message);
  }

  const json = await res.json();
  const items = (json?.data ?? json?.bookings ?? []) as any[];
  if (!Array.isArray(items)) return [];
  return items.map(asBooking);
}

export async function hostConfirmBooking(bookingId: string): Promise<Booking> {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE_URL}/bookings/${bookingId}/confirm`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });

  if (!res.ok) {
    const json = await res.json().catch(() => null);
    const message =
      typeof json?.error === "string"
        ? json.error
        : typeof json?.message === "string"
          ? json.message
          : `Request failed (${res.status})`;
    throw new Error(message);
  }

  const json = await res.json();
  const raw = json?.data ?? json;
  return asBooking(raw);
}

export async function hostCancelBooking(bookingId: string): Promise<Booking> {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE_URL}/bookings/${bookingId}/cancel`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });

  if (!res.ok) {
    const json = await res.json().catch(() => null);
    const message =
      typeof json?.error === "string"
        ? json.error
        : typeof json?.message === "string"
          ? json.message
          : `Request failed (${res.status})`;
    throw new Error(message);
  }

  const json = await res.json();
  const raw = json?.data ?? json;
  return asBooking(raw);
}
