import { API_BASE_URL } from "@/constants/api";
import type { Booking, CreateBookingInput } from "@/types/booking";
import { authHeaders } from "@/store/auth-store";

export type BookingApiError = {
  status: number;
  message: string;
  code?: string;
};

function asBooking(raw: any): Booking {
  const listingId = String(raw?.listingId ?? raw?.listing_id ?? "");
  const id = String(raw?.id ?? raw?.bookingId ?? "");
  const startDate = raw?.startDate ?? raw?.start_date ?? undefined;
  const endDate = raw?.endDate ?? raw?.end_date ?? undefined;
  const guests = raw?.guests ?? raw?.guestCount ?? undefined;
  const status = raw?.status ?? undefined;
  const totalPrice = raw?.totalPrice ?? raw?.total_price ?? undefined;
  const currency = raw?.currency ?? undefined;
  const createdAt = raw?.createdAt ?? raw?.created_at ?? undefined;

  return {
    id,
    listingId,
    startDate: typeof startDate === "string" ? startDate : undefined,
    endDate: typeof endDate === "string" ? endDate : undefined,
    guests: typeof guests === "number" ? guests : undefined,
    status,
    totalPrice:
      typeof totalPrice === "number"
        ? totalPrice
        : typeof raw?.total_price === "number"
          ? raw.total_price
          : undefined,
    currency:
      typeof currency === "string"
        ? currency
        : typeof raw?.currencyCode === "string"
          ? raw.currencyCode
          : undefined,
    createdAt: typeof createdAt === "string" ? createdAt : undefined,
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

function toApiError(status: number, message: string, code?: string): BookingApiError {
  return { status, message, code };
}

export async function createBooking(
  input: CreateBookingInput,
): Promise<Booking> {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE_URL}/bookings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const status = res.status;
    const json = await res.json().catch(() => null);
    const message =
      typeof json?.error === "string"
        ? json.error
        : typeof json?.message === "string"
          ? json.message
          : `Request failed (${status})`;
    const code = typeof json?.code === "string" ? json.code : undefined;
    throw toApiError(status, message, code);
  }

  const json = await res.json();
  const raw = json?.data ?? json;
  return asBooking(raw);
}

export async function getUserBookings(): Promise<Booking[]> {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE_URL}/bookings`, { headers });

  if (res.status === 401 || res.status === 403) {
    return [];
  }
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
  const items = (json?.data ?? json) as any[];
  if (!Array.isArray(items)) return [];
  return items.map(asBooking);
}

