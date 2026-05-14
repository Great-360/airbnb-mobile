import { useCallback, useState } from "react";

// NOTE: This file currently contains both React hooks and handler exports.
// It is not used by ExploreScreen right now.

import { Listing } from "@/components/listing-card";

export const CATEGORIES = [
  { id: "all", label: "OMG!", icon: "eyeicon", type: null },
  { id: "villa", label: "Beach", icon: "beachicon", type: "villa" },
  { id: "apartment", label: "City", icon: "cityicon", type: "apartment" },
  { id: "cabin", label: "Cabin", icon: "cabinicon", type: "cabin" },
] as const;
type CategoryId = (typeof CATEGORIES)[number]["id"];
const [selectedCategory, setSelectedCategory] = useState<CategoryId>("all");
const [searchQuery, setSearchQuery] = useState("");
const [isloading, setIsLoading] = useState(true);
const [listings, setListings] = useState<Listing[]>([]);

const [error, setError] = useState<string | null>(null);

const [wishlistedIds, setWishlistedIds] = useState<Set<string>>(new Set());

export type WishlistedIdsState = Set<string>;

export const fetchListings = useCallback(async () => {
  setIsLoading(true);
  setError(null);

  try {
    const params = new URLSearchParams();

    if (searchQuery.trim()) {
      params.append("location", searchQuery.trim());
    }

    const category = CATEGORIES.find((c) => c.id === selectedCategory);

    if (category?.type) {
      params.append("type", category.type);
    }

    const url = `${process.env.API_BASE_URL}/listings?${params.toString()}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch listings: ${response.statusText}`);
    }

    const data = await response.json();

    setListings(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong";
    setError(message);
    console.error("Error fetching listings:", err);
  } finally {
    setIsLoading(false);
  }
}, [searchQuery, selectedCategory]);

export function handleCategorySelect(id: CategoryId) {
  setSelectedCategory(id);
}

export function handleWishlistToggle(listing: Listing) {
  setWishlistedIds((prev) => {
    const next = new Set(prev);
    if (next.has(listing.id)) {
      next.delete(listing.id);
    } else {
      next.add(listing.id);
    }
    return next;
  });
}

export function handleListingPress(listing: Listing) {
  console.log("pressed Listing:", listing.id);
}
