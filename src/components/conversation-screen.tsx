import { listMessages, sendMessage, type Message } from "@/api/conversation";
import { getMyConversations } from "@/api/messaging";
import { getUserById, type UserSummary } from "@/api/users";

import { ThemedText } from "@/components/themed-text";

import { Image } from "expo-image";

import { ThemedView } from "@/components/themed-view";
import { BottomTabInset, Colors, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { getToken } from "@/store/auth-store";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function formatMessageTime(iso?: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "now";
  if (diffMins < 60) return `${diffMins}m`;

  const diffHours = Math.floor(diffMs / 3600000);
  if (diffHours < 24) return `${diffHours}h`;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ConversationScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [conversationTitle, setConversationTitle] = useState("Conversation");
  const [participantAvatar, setParticipantAvatar] = useState<string | null>(
    null,
  );

  const [participantLastSeen, setParticipantLastSeen] = useState<string | null>(
    null,
  );

  const flatListRef = useRef<FlatList>(null);

  // Load conversation details and messages
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      async function load() {
        if (!conversationId) return;

        setIsLoading(true);
        try {
          const token = await getToken();
          if (cancelled) return;

          if (!token) {
            router.back();
            return;
          }

          // Parse token to get userId (assuming it's a JWT with user info)
          try {
            const parts = token.split(".");
            if (parts.length === 3) {
              // Avoid relying on Node's Buffer in React Native.
              // Basic base64url -> base64 conversion.
              const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
              const payloadJson = globalThis.atob
                ? globalThis.atob(base64)
                : (() => {
                    // Fallback for environments without atob
                    try {
                      return globalThis.atob(base64);
                    } catch {
                      return "";
                    }
                  })();
              const decoded = payloadJson ? JSON.parse(payloadJson) : null;
              setCurrentUserId(decoded?.userId || decoded?.sub || null);
            }
          } catch {
            // Fallback if token parsing fails
          }

          // Load messages
          const { messages: loadedMessages } = await listMessages(
            conversationId,
            1,
            50,
          );
          if (cancelled) return;
          setMessages(loadedMessages);

          // Load conversation details
          const conversations = await getMyConversations();
          if (cancelled) return;
          const conv = conversations.find((c) => c.id === conversationId);
          if (conv) {
            // Determine “other participant” (for 1:1 bookings)
            const other = conv.participants?.[0]?.userId
              ? conv.participants[0].userId
              : null;

            const otherName = "";
            setConversationTitle("Conversation");

            // Fetch other participant summary (name + avatar)
            if (other) {
              try {
                const otherUser: UserSummary | null = await getUserById(other);
                setConversationTitle(otherUser?.name ?? "Conversation");
                setParticipantAvatar(otherUser?.avatar ?? null);
              } catch {
                setParticipantAvatar(null);
              }
            }

            // TODO: fetch participant last seen from booking/user details
            setParticipantLastSeen("Last seen 12 hour ago");
          }
        } catch (err) {
          if (cancelled) return;
          console.error("Failed to load conversation:", err);
        } finally {
          if (!cancelled) setIsLoading(false);
        }
      }

      load();
      return () => {
        cancelled = true;
      };
    }, [conversationId, router]),
  );

  // Scroll to bottom when messages update
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  async function handleSendMessage() {
    if (!messageText.trim() || !conversationId || isSending) return;

    const textToSend = messageText.trim();
    setMessageText("");
    setIsSending(true);

    try {
      const newMessage = await sendMessage(conversationId, textToSend);
      setMessages((prev) => [...prev, newMessage]);
    } catch (err) {
      console.error("Failed to send message:", err);
      setMessageText(textToSend); // restore text on error
    } finally {
      setIsSending(false);
    }
  }

  function renderEmptyState() {
    return (
      <View style={styles.emptyState}>
        <SymbolView
          name={{ ios: "message", android: "chat_bubble", web: "chat_bubble" }}
          size={80}
          tintColor={theme.textSecondary}
        />
        <ThemedText style={styles.emptyTitle}>This chat is empty</ThemedText>
        <ThemedText style={[styles.emptyBody, { color: theme.textSecondary }]}>
          Be the first one to start it.
        </ThemedText>
      </View>
    );
  }

  function renderMessageBubble(message: Message) {
    const isOwnMessage = message.senderId === currentUserId;
    return (
      <View key={message.id} style={styles.messageRow}>
        <View
          style={[
            styles.bubble,
            {
              backgroundColor: isOwnMessage
                ? Colors.light.primary
                : theme.border,
              alignSelf: isOwnMessage ? "flex-end" : "flex-start",
            },
          ]}
        >
          <ThemedText
            style={[
              styles.messageText,
              { color: isOwnMessage ? "#fff" : theme.text },
            ]}
          >
            {message.content}
          </ThemedText>
        </View>
        <ThemedText
          style={[
            styles.messageTime,
            {
              color: theme.textSecondary,
              alignSelf: isOwnMessage ? "flex-end" : "flex-start",
            },
          ]}
        >
          {formatMessageTime(message.createdAt)}
        </ThemedText>
      </View>
    );
  }

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView
          style={[styles.safeArea, { paddingBottom: BottomTabInset }]}
          edges={["top", "left", "right"]}
        >
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={Colors.light.primary} />
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView
        style={[styles.safeArea, { paddingBottom: 0 }]}
        edges={["top", "left", "right"]}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <SymbolView
              name={{
                ios: "chevron.left",
                android: "arrow_back",
                web: "arrow_back",
              }}
              size={24}
              tintColor={theme.text}
            />
          </Pressable>
          <View style={styles.headerTitle}>
            <View style={styles.headerRow}>
              {participantAvatar ? (
                <View style={styles.avatarWrap}>
                  <Image
                    source={{ uri: participantAvatar }}
                    style={styles.avatar}
                    contentFit="cover"
                  />
                </View>
              ) : (
                <View
                  style={[
                    styles.avatarWrap,
                    { justifyContent: "center", alignItems: "center" },
                  ]}
                >
                  <SymbolView
                    name={
                      {
                        ios: "person.circle",
                        android: "person",
                        web: "person",
                      } as any
                    }
                    size={24}
                    tintColor={theme.textSecondary}
                  />
                </View>
              )}

              <ThemedText style={styles.conversationName} numberOfLines={1}>
                {conversationTitle}
              </ThemedText>
            </View>

            {participantLastSeen && (
              <ThemedText
                style={[
                  styles.participantLastSeen,
                  { color: theme.textSecondary },
                ]}
              >
                {participantLastSeen}
              </ThemedText>
            )}
          </View>
        </View>

        {/* Messages */}
        <View style={styles.content}>
          {messages.length === 0 ? (
            renderEmptyState()
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={({ item }) => renderMessageBubble(item)}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.messagesContent}
              scrollEnabled
              nestedScrollEnabled
            />
          )}
        </View>

        {/* Input */}
        <View style={[styles.inputContainer, { borderTopColor: theme.border }]}>
          <TextInput
            style={[
              styles.input,
              {
                color: theme.text,
                borderColor: theme.border,
                backgroundColor: theme.background,
              },
            ]}
            placeholder="Type a message here..."
            placeholderTextColor={theme.textSecondary}
            value={messageText}
            onChangeText={setMessageText}
            editable={!isSending}
            multiline
          />
          <Pressable
            onPress={handleSendMessage}
            disabled={!messageText.trim() || isSending}
            style={({ pressed }) => [
              styles.sendButton,
              {
                backgroundColor:
                  messageText.trim() && !isSending
                    ? Colors.light.primary
                    : Colors.light.border,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <SymbolView
              name={{ ios: "arrow.up", android: "send", web: "send" }}
              size={20}
              tintColor="#fff"
            />
          </Pressable>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    paddingRight: Spacing.three,
  },
  headerTitle: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
  },
  avatarWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.background,
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  conversationName: {
    fontSize: 16,
    fontWeight: "600",
  },
  participantLastSeen: {
    fontSize: 12,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.three,
    paddingHorizontal: Spacing.five,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: Spacing.four,
  },
  emptyBody: {
    fontSize: 14,
    textAlign: "center",
  },
  messagesContent: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
    gap: Spacing.three,
  },
  messageRow: {
    marginBottom: Spacing.two,
  },
  bubble: {
    borderRadius: 16,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    maxWidth: "80%",
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 11,
    marginTop: Spacing.one,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingBottom: BottomTabInset + Spacing.three,
  },
  input: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 20,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 14,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
});
