import { getMyConversations, type Conversation } from "@/api/messaging";
import { getUserById, type UserSummary } from "@/api/users";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BottomTabInset, Colors, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { getToken } from "@/store/auth-store";
import {
  getNotifications,
  subscribe,
  clearNotifications,
  type AppNotification,
} from "@/store/notification-store";
import { Image } from "expo-image";
import { SymbolView } from "expo-symbols";
import React, { useCallback, useEffect, useState } from "react";

import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

const NOTIFICATION_ICONS = {
  success: { ios: "checkmark.circle.fill", android: "check_circle", web: "check_circle" },
  error: { ios: "exclamationmark.triangle.fill", android: "warning", web: "warning" },
  info: { ios: "bell.fill", android: "notifications", web: "notifications" },
} as const;

const NOTIFICATION_COLORS = {
  success: "#4caf50",
  error: "#f44336",
  info: "#2196f3",
} as const;

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
  const { tab } = useLocalSearchParams<{ tab?: string }>();

  const [activeTab, setActiveTab] = useState<"messages" | "notifications">(
    tab === "notifications" ? "notifications" : "messages"
  );
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>(
    getNotifications()
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [participantByUserId, setParticipantByUserId] = useState<
    Record<string, UserSummary | null>
  >({});

  // Synchronize route param tab with activeTab state
  useEffect(() => {
    if (tab === "notifications") {
      setActiveTab("notifications");
    } else if (tab === "messages") {
      setActiveTab("messages");
    }
  }, [tab]);

  // Subscribe to notification store changes
  useEffect(() => {
    const unsub = subscribe(() => {
      setNotifications(getNotifications());
    });
    return unsub;
  }, []);

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

          const uniqueUserIds = new Set<string>();
          for (const c of items) {
            for (const p of c.participants) {
              if (p?.userId) uniqueUserIds.add(p.userId);
            }
          }

          const participantMap: Record<string, UserSummary | null> = {};
          for (const userId of uniqueUserIds) {
            participantMap[userId] = null;
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

  const handleClearAll = useCallback(() => {
    clearNotifications();
  }, []);

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

  function renderNotificationsEmptyState() {
    return (
      <View style={styles.emptyState}>
        <SymbolView
          name={{
            ios: "bell.slash",
            android: "notifications_off",
            web: "notifications_off",
          }}
          size={48}
          tintColor={theme.textSecondary}
        />
        <ThemedText style={styles.emptyTitle}>
          No notifications yet
        </ThemedText>
        <ThemedText
          style={[styles.emptyBody, { color: theme.textSecondary }]}
        >
          Any booking updates or wishlist alerts will appear here.
        </ThemedText>
      </View>
    );
  }

  function renderNotificationItem(item: AppNotification) {
    const iconObj = NOTIFICATION_ICONS[item.type] || NOTIFICATION_ICONS.info;
    const color = NOTIFICATION_COLORS[item.type] || NOTIFICATION_COLORS.info;

    return (
      <View
        key={item.id}
        style={[
          styles.notificationCard,
          { borderColor: theme.border, backgroundColor: theme.backgroundElement },
        ]}
      >
        <View style={styles.row}>
          <View style={[styles.notificationIconWrap, { backgroundColor: color + "15" }]}>
            <SymbolView name={iconObj as any} size={22} tintColor={color} />
          </View>
          <View style={styles.notificationTextWrap}>
            <View style={styles.notificationHeaderRow}>
              <ThemedText style={styles.notificationTitle} numberOfLines={1}>
                {item.title}
              </ThemedText>
              <ThemedText style={[styles.notificationDate, { color: theme.textSecondary }]}>
                {formatDate(item.date)}
              </ThemedText>
            </View>
            {item.body ? (
              <ThemedText
                style={[styles.notificationBody, { color: theme.textSecondary }]}
                numberOfLines={2}
              >
                {item.body}
              </ThemedText>
            ) : null}
          </View>
        </View>
      </View>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView
        style={[styles.safeArea, { paddingBottom: BottomTabInset }]}
        edges={["top", "left", "right"]}
      >
        <View style={styles.headerRow}>
          <ThemedText type="subtitle" style={styles.heading}>
            Inbox
          </ThemedText>
          {activeTab === "notifications" && notifications.length > 0 && (
            <Pressable onPress={handleClearAll} style={styles.clearBtn}>
              <ThemedText style={styles.clearBtnText}>Clear all</ThemedText>
            </Pressable>
          )}
        </View>

        <View style={styles.descriptionRow}>
          <ThemedText
            style={[styles.description, { color: theme.textSecondary }]}
          >
            {activeTab === "messages"
              ? "Messages for booking conversations are shown here for hosts and guests."
              : "System and booking notifications are stored here."}
          </ThemedText>
        </View>

        <View style={styles.tabsRow}>
          <Pressable
            onPress={() => setActiveTab("messages")}
            style={[
              styles.tabBtn,
              {
                borderColor: activeTab === "messages" ? theme.text : theme.border,
                backgroundColor: activeTab === "messages"
                  ? theme.backgroundSelected
                  : theme.backgroundElement,
              },
            ]}
          >
            <ThemedText
              style={{
                fontWeight: activeTab === "messages" ? "700" : "500",
                color: theme.text,
              }}
            >
              Messages
            </ThemedText>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab("notifications")}
            style={[
              styles.tabBtn,
              {
                borderColor: activeTab === "notifications" ? theme.text : theme.border,
                backgroundColor: activeTab === "notifications"
                  ? theme.backgroundSelected
                  : theme.backgroundElement,
              },
            ]}
          >
            <ThemedText
              style={{
                fontWeight: activeTab === "notifications" ? "700" : "500",
                color: theme.text,
              }}
            >
              Notifications
            </ThemedText>
          </Pressable>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        <View style={styles.content}>
          {activeTab === "messages" ? (
            isLoading || !isLoggedIn || conversations.length === 0 ? (
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
            )
          ) : (
            notifications.length === 0 ? (
              renderNotificationsEmptyState()
            ) : (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
              >
                {notifications.map(renderNotificationItem)}
              </ScrollView>
            )
          )}
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: Spacing.four },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heading: {
    marginTop: Spacing.five,
    marginBottom: Spacing.two,
  },
  clearBtn: {
    marginTop: Spacing.five,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  clearBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.light.primary,
  },
  descriptionRow: {
    marginBottom: Spacing.four,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  tabsRow: {
    flexDirection: "row",
    gap: Spacing.two,
    marginBottom: Spacing.four,
  },
  tabBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: Spacing.two,
    alignItems: "center",
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

  notificationCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Spacing.three,
    padding: Spacing.four,
    marginBottom: Spacing.three,
    backgroundColor: "transparent",
  },
  notificationIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  notificationTextWrap: {
    flex: 1,
    gap: 4,
  },
  notificationHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: Spacing.two,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
  },
  notificationDate: {
    fontSize: 12,
  },
  notificationBody: {
    fontSize: 14,
    lineHeight: 18,
  },
});
