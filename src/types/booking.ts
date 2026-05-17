export type BookingStatus = "CONFIRMED" | "PENDING" | "CANCELLED" | string;

export type Booking = {
  id: string;
  listingId: string;
  userId?: string;
  startDate?: string; // ISO
  endDate?: string; // ISO
  guests?: number;
  status?: BookingStatus;
  totalPrice?: number;
  currency?: string;
  createdAt?: string;
  // Optional fields depending on backend response
  listing?: {
    id: string;
    title?: string;
    location?: string;
    coverUrl?: string;
  };
};

export type CreateBookingInput = {
  listingId: string;
  checkIn: string; // ISO date (YYYY-MM-DD)
  checkOut: string; // ISO date (YYYY-MM-DD)
  guests: number;
};
