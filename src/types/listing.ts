export interface ListingPhoto {
  id: string;
  url: string;
  publicId: string;
}

export interface ListingHost {
  id?: string;
  name: string;
  avatar: string | null;
  isSuperhost?: boolean;
  hostingSince?: string;
}

export type ListingType = "APARTMENT" | "HOUSE" | "VILLA" | "CABIN";

export interface Listing {
  id: string;
  title: string;
  description: string;
  location: string;
  pricePerNight: number;
  guests: number;
  type: ListingType;
  amenities: string[];
  rating: number | null;
  photos: ListingPhoto[];
  host: ListingHost;
}

export interface ListingDetail extends Listing {
  latitude?: number | null;
  longitude?: number | null;
  reviewCount?: number;
  bedrooms?: { name: string; beds: string }[];
}

export interface ReviewAuthor {
  name: string;
  avatar: string | null;
}

export interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  author: ReviewAuthor;
}

export interface ReviewsResponse {
  data: Review[];
  meta: {
    total: number;
    averageRating: number;
  };
}
