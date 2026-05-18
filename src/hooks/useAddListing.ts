import { useCallback, useMemo, useState } from "react";

import { API_BASE_URL } from "@/constants/api";
import { authHeaders } from "@/store/auth-store";
import type { ListingType } from "@/types/listing";

export type AddListingDraft = {
  title: string;
  description: string;
  location: string;
  pricePerNight: string; // keep as string for TextInput
  guests: string;
  type: ListingType;
  amenities: string; // comma-separated
};

export type AddListingPhoto = { uri: string; name?: string; type?: string };

function parseNumber(value: string): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function parseAmenities(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function useAddListing() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validate = useCallback((draft: AddListingDraft) => {
    const price = parseNumber(draft.pricePerNight);
    const guests = parseNumber(draft.guests);

    if (draft.title.trim().length === 0) return "Please provide a title.";
    if (draft.description.trim().length === 0)
      return "Please provide a description.";
    if (draft.location.trim().length === 0) return "Please provide a location.";
    if (price == null) return "Please provide a valid price per night.";
    if (guests == null) return "Please provide valid guests.";
    if (!draft.type) return "Please select a listing type.";

    return null;
  }, []);

  const canSubmit = useCallback(
    (draft: AddListingDraft) => {
      return validate(draft) == null;
    },
    [validate],
  );

  const submit = useCallback(
    async ({
      draft,
      photos,
    }: {
      draft: AddListingDraft;
      photos: AddListingPhoto[];
    }) => {
      setIsSubmitting(true);
      setError(null);

      try {
        // If photo picking isn't available, keep going without photos.
        // (This hook doesn't know about the picker; caller can pass an empty photos array.)

        const validationError = validate(draft);
        if (validationError) {
          setError(validationError);
          return;
        }

        const price = parseNumber(draft.pricePerNight);
        const guests = parseNumber(draft.guests);
        if (price == null || guests == null) {
          setError("Please provide valid price per night and guests.");
          return;
        }

        const payload = {
          title: draft.title.trim(),
          description: draft.description.trim(),
          location: draft.location.trim(),
          pricePerNight: price,
          type: draft.type,
          guests,
          amenities: parseAmenities(draft.amenities),
        };

        const headers = await authHeaders();

        const createRes = await fetch(`${API_BASE_URL}/listings`, {
          method: "POST",
          headers: {
            ...headers,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!createRes.ok) {
          const text = await createRes.text().catch(() => "");
          throw new Error(
            `Failed to create listing (${createRes.status}). ${text}`,
          );
        }

        const createdJson = await createRes.json();
        const created = createdJson.data ?? createdJson;
        const listingId = String(created.id);

        // Upload photos (optional)
        if (photos.length > 0) {
          const form = new FormData();
          for (const p of photos) {
            // Multer expects field name: photos
            form.append("photos", {
              uri: p.uri,
              name: p.name ?? `photo-${Date.now()}.jpg`,
              type: p.type ?? "image/jpeg",
            } as any);
          }

          const photoRes = await fetch(
            `${API_BASE_URL}/listings/${listingId}/photos`,
            {
              method: "POST",
              headers: {
                ...(await authHeaders()),
                // Do NOT set Content-Type explicitly. RN/FormData will set it.
              },
              body: form,
            },
          );

          if (!photoRes.ok) {
            const text = await photoRes.text().catch(() => "");
            throw new Error(
              `Listing created, but photo upload failed (${photoRes.status}). ${text}`,
            );
          }
        }

        return created;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
        return;
      } finally {
        setIsSubmitting(false);
      }
    },
    [validate],
  );

  return useMemo(
    () => ({ isSubmitting, error, canSubmit, submit }),
    [isSubmitting, error, canSubmit, submit],
  );
}
