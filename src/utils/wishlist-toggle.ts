import { API_BASE_URL } from "@/constants/api";
import { authHeaders } from "@/store/auth-store";
import type { Listing } from "@/types/listing";
import type { Router } from "expo-router";

export type WishlistToggleResult =
  | { ok: true; wasSaved: boolean }
  | { ok: false; reason: "unauthenticated" | "api_error" | "network_error" };

type ToggleWishlistOptions = {
  listing: Listing;
  wasSaved: boolean;
  router: Router;
  returnTo?: string;
};

export async function toggleWishlist({
  listing,
  wasSaved,
  router,
  returnTo,
}: ToggleWishlistOptions): Promise<WishlistToggleResult> {
  const headers = await authHeaders();
  if (!("Authorization" in headers)) {
    if (returnTo) {
      router.push({ pathname: "/profile", params: { returnTo } });
    } else {
      router.push("/profile");
    }
    return { ok: false, reason: "unauthenticated" };
  }

  try {
    const res = await fetch(`${API_BASE_URL}/wishlists/${listing.id}`, {
      method: wasSaved ? "DELETE" : "POST",
      headers,
    });
    if (!res.ok) {
      return { ok: false, reason: "api_error" };
    }
    return { ok: true, wasSaved };
  } catch {
    return { ok: false, reason: "network_error" };
  }
}
