import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import {
  useAddListing,
  type AddListingDraft,
  type AddListingPhoto,
} from "@/hooks/useAddListing";
import type { ListingType } from "@/types/listing";

const DEFAULT_DRAFT: AddListingDraft = {
  title: "",
  description: "",
  location: "",
  pricePerNight: "",
  guests: "",
  type: "APARTMENT",
  amenities: "",
};

function sanitizePickedAsset(
  asset: ImagePicker.ImagePickerAsset,
): AddListingPhoto | null {
  if (!asset?.uri) return null;
  // expo-image-picker typically provides these; name/mime might be undefined.
  const uri = asset.uri;
  const name = asset.fileName ?? `photo-${Date.now()}.jpg`;
  const type = asset.mimeType ?? "image/jpeg";
  return { uri, name, type };
}

export default function HostAddListingScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { isSubmitting, error, canSubmit, submit } = useAddListing();

  const [draft, setDraft] = useState<AddListingDraft>(DEFAULT_DRAFT);
  const [photos, setPhotos] = useState<AddListingPhoto[]>([]);
  const [isPicking, setIsPicking] = useState(false);

  const listingTypes: ListingType[] = useMemo(
    () => ["APARTMENT", "HOUSE", "VILLA", "CABIN"],
    [],
  );

  const onPickImages = useCallback(async () => {
    setIsPicking(true);
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          "Permission required",
          "We need access to your photo library to upload listing images.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.85,
      });

      if (result.canceled) return;

      const assets = result.assets ?? [];
      const picked = assets
        .map(sanitizePickedAsset)
        .filter((x): x is AddListingPhoto => x !== null);

      setPhotos(picked);
    } catch (e) {
      Alert.alert(
        "Upload setup failed",
        e instanceof Error ? e.message : "Something went wrong",
      );
    } finally {
      setIsPicking(false);
    }
  }, []);

  const updateDraft = useCallback(
    <K extends keyof AddListingDraft>(key: K, value: AddListingDraft[K]) => {
      setDraft((d) => ({ ...d, [key]: value }));
    },
    [],
  );

  const onSubmit = useCallback(async () => {
    if (!canSubmit(draft)) {
      Alert.alert("Missing details", "Please fill in all required fields.");
      return;
    }

    await submit({ draft, photos });

    // If backend fails, hook keeps error; otherwise listing is created and we can navigate.
    // Since hook doesn't expose success, we check isSubmitting transition.
    // A simple UX: optimistic navigation only when there's no current error.
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!error) {
      router.replace("/host/listings");
    }
  }, [canSubmit, draft, photos, submit, error, router]);

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <ThemedText type="subtitle" style={styles.heading}>
            Create listing
          </ThemedText>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.label}>Title</ThemedText>
          <TextInput
            value={draft.title}
            onChangeText={(t) => updateDraft("title", t)}
            placeholder="e.g. Sunny apartment"
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { borderColor: theme.border }]}
          />

          <ThemedText style={[styles.label, { marginTop: Spacing.two }]}>
            Description
          </ThemedText>
          <TextInput
            value={draft.description}
            onChangeText={(t) => updateDraft("description", t)}
            placeholder="Describe your place"
            placeholderTextColor={theme.textSecondary}
            style={[
              styles.input,
              styles.textArea,
              { borderColor: theme.border },
            ]}
            multiline
          />

          <ThemedText style={[styles.label, { marginTop: Spacing.two }]}>
            Location
          </ThemedText>
          <TextInput
            value={draft.location}
            onChangeText={(t) => updateDraft("location", t)}
            placeholder="City, region"
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { borderColor: theme.border }]}
          />

          <View style={styles.row2}>
            <View style={{ flex: 1 }}>
              <ThemedText style={styles.label}>Price / night</ThemedText>
              <TextInput
                value={draft.pricePerNight}
                onChangeText={(t) => updateDraft("pricePerNight", t)}
                placeholder="e.g. 120"
                keyboardType="numeric"
                placeholderTextColor={theme.textSecondary}
                style={[styles.input, { borderColor: theme.border }]}
              />
            </View>

            <View style={{ flex: 1 }}>
              <ThemedText style={styles.label}>Guests</ThemedText>
              <TextInput
                value={draft.guests}
                onChangeText={(t) => updateDraft("guests", t)}
                placeholder="e.g. 2"
                keyboardType="numeric"
                placeholderTextColor={theme.textSecondary}
                style={[styles.input, { borderColor: theme.border }]}
              />
            </View>
          </View>

          <ThemedText style={[styles.label, { marginTop: Spacing.two }]}>
            Type
          </ThemedText>
          <View style={styles.typeRow}>
            {listingTypes.map((t) => {
              const active = draft.type === t;
              return (
                <Pressable
                  key={t}
                  onPress={() => updateDraft("type", t)}
                  style={({ pressed }) => [
                    styles.typeChip,
                    {
                      backgroundColor: active
                        ? Colors.light.primary
                        : Colors.light.primary + "12",
                      opacity: pressed ? 0.85 : 1,
                      borderColor: active ? Colors.light.primary : theme.border,
                    },
                  ]}
                >
                  <ThemedText
                    style={{
                      color: active ? "#fff" : theme.textSecondary,
                      fontWeight: "700",
                      fontSize: 12,
                    }}
                  >
                    {t.charAt(0) + t.slice(1).toLowerCase()}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>

          <ThemedText style={[styles.label, { marginTop: Spacing.two }]}>
            Amenities (comma-separated)
          </ThemedText>
          <TextInput
            value={draft.amenities}
            onChangeText={(t) => updateDraft("amenities", t)}
            placeholder="wifi, kitchen, parking"
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { borderColor: theme.border }]}
          />
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.label}>Images</ThemedText>

          <Pressable
            onPress={onPickImages}
            style={({ pressed }) => [
              styles.pickBtn,
              {
                backgroundColor: pressed
                  ? Colors.light.primary + "cc"
                  : Colors.light.primary,
              },
            ]}
            disabled={isPicking}
          >
            <ThemedText style={styles.pickBtnText}>
              {isPicking
                ? "Picking…"
                : `Select images (${photos.length} selected)`}
            </ThemedText>
          </Pressable>

          <ThemedText style={[styles.helpText, { color: theme.textSecondary }]}>
            Up to multiple images. Selected photos will be uploaded after you
            submit.
          </ThemedText>
        </View>

        {error ? (
          <ThemedText style={styles.errorText}>{error}</ThemedText>
        ) : null}

        <Pressable
          onPress={onSubmit}
          disabled={isSubmitting}
          style={({ pressed }) => [
            styles.submitBtn,
            {
              backgroundColor: pressed
                ? Colors.light.primary + "cc"
                : Colors.light.primary,
              opacity: isSubmitting ? 0.7 : 1,
              borderColor: isSubmitting ? Colors.light.primary : theme.border,
            },
          ]}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText style={styles.submitBtnText}>
              Create & upload
            </ThemedText>
          )}
        </Pressable>

        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backBtn,
            { opacity: pressed ? 0.8 : 1 },
          ]}
          disabled={isSubmitting}
        >
          <ThemedText style={{ color: theme.textSecondary, fontWeight: "600" }}>
            Cancel
          </ThemedText>
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.five,
    paddingBottom: Spacing.five,
    gap: Spacing.four,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heading: { fontSize: 24, fontWeight: "800" },

  section: { gap: Spacing.two },
  label: { fontSize: 14, fontWeight: "700" },

  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    backgroundColor: "transparent",
    color: "#000",
  },
  textArea: { minHeight: 110, textAlignVertical: "top" },

  row2: { flexDirection: "row", gap: Spacing.two },

  typeRow: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.two },
  typeChip: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999,
    paddingHorizontal: Spacing.two,
    paddingVertical: 6,
  },

  pickBtn: {
    borderRadius: 12,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    alignItems: "center",
  },
  pickBtnText: { color: "#fff", fontWeight: "800" },
  helpText: { fontSize: 12, lineHeight: 18 },

  errorText: { color: "#ff4d4f", fontWeight: "700", paddingTop: Spacing.two },

  submitBtn: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    paddingVertical: Spacing.three,
    alignItems: "center",
  },
  submitBtnText: { color: "#fff", fontWeight: "800" },

  backBtn: {
    alignItems: "center",
    paddingVertical: Spacing.two,
  },
});
