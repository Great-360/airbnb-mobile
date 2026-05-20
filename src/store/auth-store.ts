// src/store/auth-store.ts
//
// WHY A STORE?
// The JWT token from login needs to be accessible on both the explore screen
// (to fetch wishlist IDs) and the wishlist screen (to load saved listings).
// Rather than prop-drilling or re-fetching the token everywhere, we keep it
// in one place with expo-secure-store for persistence across app restarts.
//
// Install first:  npx expo install expo-secure-store

import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "auth_token";
let cachedToken: string | null | undefined;

// ── Write token after a successful login ──────────────────────────────────────
export async function saveToken(token: string): Promise<void> {
  cachedToken = token;
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

// ── Read token (returns null if not logged in) ────────────────────────────────
export async function getToken(): Promise<string | null> {
  if (cachedToken !== undefined) {
    return cachedToken;
  }
  cachedToken = await SecureStore.getItemAsync(TOKEN_KEY);
  return cachedToken;
}

// ── Delete token on logout ──────────────────────────────────────────────────
export async function clearToken(): Promise<void> {
  cachedToken = null;
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

// ── Build the Authorization header object ─────────────────────────────────────
// Usage:  fetch(url, { headers: await authHeaders() })
export async function authHeaders(): Promise<HeadersInit> {
  const token = await getToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}
