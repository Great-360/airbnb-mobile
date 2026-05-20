import { getMyConversations, type Conversation } from "@/api/messaging";
import { getUserById, type UserSummary } from "@/api/users";
import { useRouter } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BottomTabInset, Colors, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { getToken } from "@/store/auth-store";
import { Image } from "expo-image";
import { useFocusEffect } from "expo-router";
import { SymbolView } from "expo-symbols";
import React, { useCallback, useState } from "react";

import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

function formatDate(iso?: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function conversationSubtitle(conversation: Conversation): string {
  const participantCount = conversation.participants.length;
  const participantLabel =
    participantCount === 1 ? "participant" : "participants";
  const updated = conversation.updatedAt
    ? ` · Updated ${formatDate(conversation.updatedAt)}`
    : "";
  return `${participantCount} ${participantLabel}${updated}`;
}

export default function InboxScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [participantByUserId, setParticipantByUserId] = useState<
    Record<string, UserSummary | null>
  >({});

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      async function load() {
        setIsLoading(true);
        try {
          const token = await getToken();
          if (cancelled) return;

          if (!token) {
            setIsLoggedIn(false);
            setConversations([]);
            return;
          }

          setIsLoggedIn(true);
          const items = await getMyConversations();
          if (cancelled) return;
          setConversations(items);

          // Load the “other participant” (name + avatar) for each conversation.
          // Conversation payload provides participants + hostId/guestId.
          const tokenUserId = (() => {
            // We don't have a guaranteed userId in token here; best-effort: infer from current session
            // via conversation participants list (we'll still display other participant even if we can't
            // perfectly detect “self”).
            return null;
          })();

          const uniqueUserIds = new Set<string>();
          for (const c of items) {
            for (const p of c.participants) {
              if (p?.userId) uniqueUserIds.add(p.userId);
            }
          }

          const participantMap: Record<string, UserSummary | null> = {};
          for (const userId of uniqueUserIds) {
            try {
              participantMap[userId] = null;
            } catch {
              participantMap[userId] = null;
            }
          }

          // Fetch user profiles sequentially to avoid hammering API.
          for (const userId of uniqueUserIds) {
            if (cancelled) break;
            try {
              participantMap[userId] = await getUserById(userId);
            } catch {
              participantMap[userId] = null;
            }
          }

          if (!cancelled) setParticipantByUserId(participantMap);
        } catch {
          if (cancelled) return;
          setConversations([]);
        } finally {
          if (!cancelled) setIsLoading(false);
        }
      }

      load();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  function renderEmptyState() {
    if (isLoading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      );
    }

    if (!isLoggedIn) {
      return (
        <View style={styles.emptyState}>
          <SymbolView
            name={{
              ios: "message",
              android: "chat_bubble",
              web: "chat_bubble",
            }}
            size={48}
            tintColor={theme.textSecondary}
          />
          <ThemedText style={styles.emptyTitle}>
            Sign in to view messages
          </ThemedText>
          <ThemedText
            style={[styles.emptyBody, { color: theme.textSecondary }]}
          >
            Conversations for your bookings will appear here once you are signed
            in.
          </ThemedText>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <SymbolView
          name={{ ios: "message", android: "chat_bubble", web: "chat_bubble" }}
          size={48}
          tintColor={theme.textSecondary}
        />
        <ThemedText style={styles.emptyTitle}>No conversations yet</ThemedText>
        <ThemedText style={[styles.emptyBody, { color: theme.textSecondary }]}>
          When a booking creates a conversation, it will appear here for both
          hosts and guests.
        </ThemedText>
      </View>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView
        style={[styles.safeArea, { paddingBottom: BottomTabInset }]}
        edges={["top", "left", "right"]}
      >
        <ThemedText type="subtitle" style={styles.heading}>
          Inbox
        </ThemedText>

        <View style={styles.descriptionRow}>
          <ThemedText
            style={[styles.description, { color: theme.textSecondary }]}
          >
            Messages for booking conversations are shown here for hosts and
            guests.
          </ThemedText>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        <View style={styles.content}>
          {isLoading || !isLoggedIn || conversations.length === 0 ? (
            renderEmptyState()
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {conversations.map((conversation) => {
                const otherParticipants = conversation.participants;
                const otherNames = otherParticipants
                  .map((p) => participantByUserId[p.userId]?.name)
                  .filter(Boolean) as string[];

                const title =
                  otherNames.length > 0
                    ? otherNames.length === 1
                      ? otherNames[0]
                      : `${otherNames[0]} + ${otherNames.length - 1} more`
                    : "Message";

                return (
                  <Pressable
                    key={conversation.id}
                    onPress={() =>
                      router.push({
                        pathname: "/conversation/[conversationId]",
                        params: { conversationId: conversation.id },
                      } as any)
                    }
                    style={({ pressed }) => [
                      styles.conversationCard,
                      { borderColor: theme.border, opacity: pressed ? 0.9 : 1 },
                    ]}
                  >
                    <View style={styles.row}>
                      <View
                        style={[
                          styles.thumbWrap,
                          {
                            backgroundColor: theme.background,
                            borderColor: theme.border,
                          },
                        ]}
                      >
                        <View style={{ width: "100%", height: "100%" }}>
                          {(() => {
                            const otherUserId = conversation.participants.find(
                              (p) => p.userId,
                            )?.userId;
                            const avatarUri = otherUserId
                              ? participantByUserId[otherUserId]?.avatar
                              : null;

                            if (avatarUri) {
                              return (
                                <Image
                                  source={{ uri: avatarUri }}
                                  style={{ width: "100%", height: "100%" }}
                                  contentFit="cover"
                                />
                              );
                            }

                            return (
                              <SymbolView
                                name={
                                  {
                                    ios: "person.circle",
                                    android: "person",
                                    web: "person",
                                  } as any
                                }
                                size={28}
                                tintColor={theme.textSecondary}
                              />
                            );
                          })()}
                        </View>
                      </View>

                      <View style={styles.conversationText}>
                        <ThemedText
                          style={styles.conversationTitle}
                          numberOfLines={1}
                        >
                          {title}
                        </ThemedText>
                        <ThemedText
                          style={[
                            styles.conversationSubtitle,
                            { color: theme.textSecondary },
                          ]}
                          numberOfLines={2}
                        >
                          {conversationSubtitle(conversation)}
                        </ThemedText>
                      </View>

                      <View style={styles.chevronWrap}>
                        <SymbolView
                          name={
                            {
                              ios: "chevron.right",
                              android: "chevron_right",
                              web: "chevron_right",
                            } as any
                          }
                          size={20}
                          tintColor={theme.textSecondary}
                        />
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: Spacing.four },
  heading: {
    marginTop: Spacing.five,
    marginBottom: Spacing.two,
  },
  descriptionRow: {
    marginBottom: Spacing.four,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginBottom: Spacing.four,
  },
  content: { flex: 1 },
  scrollContent: { paddingBottom: Spacing.five },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.three,
    paddingHorizontal: Spacing.five,
  },
  emptyTitle: {
    fontWeight: "600",
    fontSize: 18,
    textAlign: "center",
  },
  emptyBody: {
    textAlign: "center",
    lineHeight: 22,
    fontSize: 14,
  },
  thumbWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  thumb: {
    width: "100%",
    height: "100%",
  },
  chevronWrap: {
    width: 28,
    alignItems: "flex-end",
  },

  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  conversationCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Spacing.three,
    padding: Spacing.four,
    marginBottom: Spacing.three,
    backgroundColor: "transparent",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.four,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  conversationText: {
    flex: 1,
    gap: 2,
  },
  conversationTitle: {
    fontSize: 16,
    fontWeight: "700",
    flexShrink: 1,
  },

  conversationSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  updatedAt: {
    fontSize: 12,
    textAlign: "right",
  },
});
