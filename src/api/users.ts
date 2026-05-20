import { API_BASE_URL } from "@/constants/api";
import { authHeaders } from "@/store/auth-store";

export type UserSummary = {
  id: string;
  name: string;
  avatar: string | null;
};

function asUserSummary(raw: any): UserSummary {
  return {
    id: String(raw?.id ?? ""),
    name: String(raw?.name ?? raw?.username ?? "Guest"),
    avatar:
      typeof raw?.avatar === "string"
        ? raw.avatar
        : typeof raw?.avatarUrl === "string"
          ? raw.avatarUrl
          : null,
  };
}

export async function getUserById(userId: string): Promise<UserSummary | null> {
  if (!userId) return null;
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE_URL}/users/${userId}`, { headers });

  if (res.status === 401 || res.status === 403) return null;
  if (res.status === 404) return null;

  if (!res.ok) {
    const json = await res.json().catch(() => null);
    const message =
      typeof json?.error === "string"
        ? json.error
        : typeof json?.message === "string"
          ? json.message
          : `Failed to load user (${res.status})`;
    throw new Error(message);
  }

  const json = await res.json();
  const raw = json?.data ?? json;
  return raw && typeof raw === "object" ? asUserSummary(raw) : null;
}
