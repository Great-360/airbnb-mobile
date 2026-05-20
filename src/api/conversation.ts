import { API_BASE_URL } from "@/constants/api";
import { authHeaders } from "@/store/auth-store";

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt?: string;
};

export type MessagesPagination = {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
};

function asMessage(raw: any): Message {
  return {
    id: String(raw?.id ?? ""),
    conversationId: String(raw?.conversationId ?? raw?.conversation_id ?? ""),
    senderId: String(raw?.senderId ?? raw?.sender_id ?? ""),
    content: String(raw?.content ?? ""),
    createdAt:
      typeof raw?.createdAt === "string"
        ? raw.createdAt
        : typeof raw?.created_at === "string"
          ? raw.created_at
          : undefined,
  };
}

export async function listMessages(
  conversationId: string,
  page: number = 1,
  limit: number = 20,
): Promise<{ messages: Message[]; pagination: MessagesPagination }> {
  const headers = await authHeaders();
  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  const res = await fetch(
    `${API_BASE_URL}/messaging/conversations/${conversationId}/messages?${query}`,
    { headers },
  );

  if (res.status === 401 || res.status === 403) {
    return {
      messages: [],
      pagination: { page, limit, totalCount: 0, totalPages: 0 },
    };
  }

  if (!res.ok) {
    const json = await res.json().catch(() => null);
    const message =
      typeof json?.error === "string"
        ? json.error
        : typeof json?.message === "string"
          ? json.message
          : `Failed to load messages (${res.status})`;
    throw new Error(message);
  }

  const json = await res.json();
  const items = (json?.data ?? []) as any[];
  const pagination = json?.pagination ?? {
    page,
    limit,
    totalCount: items.length,
    totalPages: 1,
  };

  return {
    messages: Array.isArray(items) ? items.map(asMessage) : [],
    pagination,
  };
}

export async function sendMessage(
  conversationId: string,
  content: string,
): Promise<Message> {
  const headers = await authHeaders();
  const res = await fetch(
    `${API_BASE_URL}/messaging/conversations/${conversationId}/messages`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify({ content }),
    },
  );

  if (!res.ok) {
    const json = await res.json().catch(() => null);
    const message =
      typeof json?.error === "string"
        ? json.error
        : typeof json?.message === "string"
          ? json.message
          : `Failed to send message (${res.status})`;
    throw new Error(message);
  }

  const json = await res.json();
  const raw = json?.data ?? json;
  return asMessage(raw);
}
