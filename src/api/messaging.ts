import { API_BASE_URL } from "@/constants/api";
import { authHeaders } from "@/store/auth-store";

export type ConversationParticipant = {
  userId: string;
};

export type Conversation = {
  id: string;
  bookingId: string;
  hostId: string;
  guestId: string;
  updatedAt?: string;
  participants: ConversationParticipant[];
};

function asConversation(raw: any): Conversation {
  return {
    id: String(raw?.id ?? ""),
    bookingId: String(raw?.bookingId ?? raw?.booking_id ?? ""),
    hostId: String(raw?.hostId ?? raw?.host_id ?? ""),
    guestId: String(raw?.guestId ?? raw?.guest_id ?? ""),
    updatedAt:
      typeof raw?.updatedAt === "string"
        ? raw.updatedAt
        : typeof raw?.updated_at === "string"
          ? raw.updated_at
          : undefined,
    participants: Array.isArray(raw?.participants)
      ? raw.participants.map((item: any) => ({
          userId: String(item?.userId ?? item?.user_id ?? ""),
        }))
      : [],
  };
}

export async function getMyConversations(): Promise<Conversation[]> {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE_URL}/messaging/conversations`, {
    headers,
  });

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
          : `Failed to load conversations (${res.status})`;
    throw new Error(message);
  }

  const json = await res.json();
  const items = (json?.data ?? json) as any[];
  if (!Array.isArray(items)) return [];
  return items.map(asConversation);
}
