import { useLocalSearchParams, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { API_BASE_URL } from "@/constants/api";
import { Colors, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import {
  authHeaders,
  clearToken,
  getToken,
  saveToken,
} from "@/store/auth-store";

const MENU_ITEMS = [
  {
    icon: { ios: "person", android: "person", web: "person" },
    label: "Personal Info",
  },
  {
    icon: { iso: "lock.shield", android: "security", web: "security" },
    label: "Login & Security",
  },
  {
    icon: { ios: "creditcard", android: "credit_card", web: "credit_card" },
    label: "Payment & payouts",
  },
  {
    icon: { ios: "bell", android: "notifications", web: "notifications" },
    label: "Notifications",
  },
  {
    icon: { ios: "questionmark.circle", android: "help", web: "help" },
    label: "Get help",
  },
] as const;

type AuthView = "loading" | "guest" | "authenticated";

type ActiveTab = "login" | "register";

type Role = "HOST" | "GUEST";

type User = {
  id: string;
  name: string;
  email: string;
  username?: string | null;
  phone?: string | null;
  role?: Role | string | null;
  avatarUrl?: string | null;
};

function getInitials(name?: string | null) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0]?.[0] ?? "";
  const second = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  const out = `${first}${second}`.toUpperCase();
  return out || "?";
}

export default function ProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();

  const [authView, setAuthView] = useState<AuthView>("loading");
  const [activeTab, setActiveTab] = useState<ActiveTab>("login");
  const [user, setUser] = useState<User | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // login
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // register
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerPhone, setRegisterPhone] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerRole, setRegisterRole] = useState<Role>("GUEST");

  const apiBase = useMemo(() => API_BASE_URL, []);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        setAuthView("loading");
        const token = await getToken();
        if (!token) {
          setAuthView("guest");
          setUser(null);
          return;
        }

        // Logged in — fetch real profile
        const headers = await authHeaders();
        const res = await fetch(`${apiBase}/auth/me`, { headers });
        if (!res.ok) {
          await clearToken();
          if (cancelled) return;
          setAuthView("guest");
          setUser(null);
          return;
        }
        const json = (await res.json()) as User;
        if (cancelled) return;
        setUser(json);
        setAuthView("authenticated");
      } catch {
        if (cancelled) return;
        setAuthView("guest");
        setUser(null);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [apiBase]);

  async function fetchMeAndSetUser() {
    const headers = await authHeaders();
    const res = await fetch(`${apiBase}/auth/me`, { headers });
    if (!res.ok) throw new Error(`Failed to load profile (${res.status})`);
    return (await res.json()) as User;
  }

  async function handleLogin() {
    setIsSubmitting(true);
    setFormError(null);
    try {
      if (!loginEmail.trim() || !loginPassword) {
        setFormError("Email and password are required.");
        return;
      }

      const res = await fetch(`${apiBase}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginEmail.trim(),
          password: loginPassword,
        }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        setFormError(json?.error ?? "Login failed. Please try again.");
        return;
      }

      const json = (await res.json()) as { token?: string; user?: User };
      if (!json.token) {
        // Backend should return token; if not, we still try to continue.
        setFormError(
          "Login succeeded but token was missing. Please try again.",
        );
        return;
      }

      await saveToken(json.token);
      const me = await fetchMeAndSetUser();
      setUser(me);
      setAuthView("authenticated");

      // Role-based routing: HOST users go to host area.
      const role = String(me.role ?? "").toUpperCase();
      if (role === "HOST") {
        // If user came from a specific listing, keep that navigation.
        if (returnTo && typeof returnTo === "string") {
          router.replace(returnTo as `/listing/${string}`);
        } else {
          router.replace("/host/listings");
        }
        return;
      }

      if (returnTo && typeof returnTo === "string") {
        router.replace(returnTo as `/listing/${string}`);
      }
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRegister() {
    setIsSubmitting(true);
    setFormError(null);
    try {
      const name = registerName.trim();
      const email = registerEmail.trim();
      const username = registerUsername.trim();
      const phone = registerPhone.trim();
      const password = registerPassword;

      if (!name || !email || !username || !phone || !password) {
        setFormError("All fields are required.");
        return;
      }
      if (password.length < 8) {
        setFormError("Password must be at least 8 characters long.");
        return;
      }

      const res = await fetch(`${apiBase}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          username,
          phone,
          password,
          role: registerRole,
        }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        setFormError(json?.error ?? "Registration failed. Please try again.");
        return;
      }

      // Backend implementation returns the created user (no token).
      // Switch to login.
      setActiveTab("login");
      setLoginEmail(email);
      setLoginPassword("");
      setFormError(null);
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleLogout() {
    setIsSubmitting(true);
    setFormError(null);
    try {
      await clearToken();
    } finally {
      setUser(null);
      setAuthView("guest");
      setIsSubmitting(false);
    }
  }

  function renderAuthForms() {
    const TabButton = ({ tab, label }: { tab: ActiveTab; label: string }) => {
      const active = activeTab === tab;
      return (
        <Pressable
          onPress={() => {
            setFormError(null);
            setActiveTab(tab);
          }}
          style={[
            styles.tabBtn,
            {
              borderColor: active ? theme.text : theme.border,
              backgroundColor: active
                ? theme.backgroundSelected
                : theme.backgroundElement,
            },
          ]}
        >
          <ThemedText
            style={{ fontWeight: active ? "700" : "500", color: theme.text }}
          >
            {label}
          </ThemedText>
        </Pressable>
      );
    };

    const submitLabel = activeTab === "login" ? "Log in" : "Create account";
    const onSubmit = activeTab === "login" ? handleLogin : handleRegister;

    return (
      <KeyboardAvoidingView
        style={styles.authForms}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? Spacing.five : 0}
      >
        <View style={styles.tabsRow}>
          <TabButton tab="login" label="Log in" />
          <TabButton tab="register" label="Register" />
        </View>

        <ScrollView
          style={styles.authScroll}
          contentContainerStyle={styles.authScrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <ThemedText type="subtitle" style={styles.formTitle}>
            {activeTab === "login" ? "Log in" : "Register"}
          </ThemedText>

          {activeTab === "login" ? (
            <View style={styles.formFields}>
              <TextInput
                value={loginEmail}
                onChangeText={setLoginEmail}
                placeholder="Email"
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor={theme.textSecondary}
                style={[
                  styles.input,
                  { color: theme.text, borderColor: theme.border },
                ]}
              />

              <TextInput
                value={loginPassword}
                onChangeText={setLoginPassword}
                placeholder="Password"
                secureTextEntry
                placeholderTextColor={theme.textSecondary}
                style={[
                  styles.input,
                  { color: theme.text, borderColor: theme.border },
                ]}
              />
            </View>
          ) : (
            <View style={styles.formFields}>
              <TextInput
                value={registerName}
                onChangeText={setRegisterName}
                placeholder="Name"
                autoCapitalize="words"
                placeholderTextColor={theme.textSecondary}
                style={[
                  styles.input,
                  { color: theme.text, borderColor: theme.border },
                ]}
              />

              <TextInput
                value={registerEmail}
                onChangeText={setRegisterEmail}
                placeholder="Email"
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor={theme.textSecondary}
                style={[
                  styles.input,
                  { color: theme.text, borderColor: theme.border },
                ]}
              />

              <TextInput
                value={registerUsername}
                onChangeText={setRegisterUsername}
                placeholder="Username"
                autoCapitalize="none"
                placeholderTextColor={theme.textSecondary}
                style={[
                  styles.input,
                  { color: theme.text, borderColor: theme.border },
                ]}
              />

              <TextInput
                value={registerPhone}
                onChangeText={setRegisterPhone}
                placeholder="Phone"
                keyboardType="phone-pad"
                placeholderTextColor={theme.textSecondary}
                style={[
                  styles.input,
                  { color: theme.text, borderColor: theme.border },
                ]}
              />

              <TextInput
                value={registerPassword}
                onChangeText={setRegisterPassword}
                placeholder="Password"
                secureTextEntry
                placeholderTextColor={theme.textSecondary}
                style={[
                  styles.input,
                  { color: theme.text, borderColor: theme.border },
                ]}
              />

              <View style={styles.roleRow}>
                <ThemedText
                  themeColor="textSecondary"
                  style={{ marginRight: Spacing.two }}
                >
                  Role
                </ThemedText>
                <View style={styles.rolePills}>
                  {(["GUEST", "HOST"] as Role[]).map((r) => {
                    const active = registerRole === r;
                    return (
                      <Pressable
                        key={r}
                        onPress={() => setRegisterRole(r)}
                        style={({ pressed }) => [
                          styles.rolePill,
                          {
                            backgroundColor: active
                              ? Colors.light.primary
                              : theme.backgroundElement,
                            opacity: pressed ? 0.85 : 1,
                            borderColor: theme.border,
                          },
                        ]}
                      >
                        <ThemedText
                          style={{
                            fontWeight: "700",
                            color: active ? "#fff" : theme.text,
                          }}
                        >
                          {r}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.formFooter}>
          <View style={styles.errorSlot}>
            {formError ? (
              <ThemedText style={styles.errorText}>{formError}</ThemedText>
            ) : null}
          </View>

          <Pressable
            disabled={isSubmitting}
            style={({ pressed }) => [
              styles.submitBtn,
              {
                backgroundColor: pressed
                  ? Colors.light.primary
                  : Colors.light.primary,
                opacity: isSubmitting ? 0.7 : 1,
              },
            ]}
            onPress={onSubmit}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.submitText}>{submitLabel}</ThemedText>
            )}
          </Pressable>

          <View style={styles.linkRow}>
            {activeTab === "login" ? (
              <>
                <ThemedText themeColor="textSecondary">New here? </ThemedText>
                <Pressable onPress={() => setActiveTab("register")}>
                  <ThemedText
                    style={{ color: Colors.light.primary, fontWeight: "600" }}
                  >
                    Create account
                  </ThemedText>
                </Pressable>
              </>
            ) : (
              <>
                <ThemedText themeColor="textSecondary">
                  Already have an account?{" "}
                </ThemedText>
                <Pressable onPress={() => setActiveTab("login")}>
                  <ThemedText
                    style={{ color: Colors.light.primary, fontWeight: "600" }}
                  >
                    Log in
                  </ThemedText>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    );
  }

  function renderProfileView() {
    return (
      <View style={{ flex: 1, gap: Spacing.three }}>
        <ThemedView type="backgroundElement" style={styles.avatarCard}>
          <ThemedView
            style={[
              styles.avatarCircle,
              { backgroundColor: Colors.light.primary },
            ]}
          >
            <ThemedText style={styles.avatarInitial}>
              {getInitials(user?.name)}
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.avatarInfo}>
            <ThemedText type="default" style={{ fontWeight: "700" }}>
              {user?.name ?? ""}
            </ThemedText>
            <ThemedText themeColor="textSecondary">
              {user?.email ?? ""}
            </ThemedText>
          </ThemedView>
        </ThemedView>

        <ThemedView type="backgroundElement" style={styles.menuCard}>
          {MENU_ITEMS.map((item, index) => (
            <React.Fragment key={index}>
              <Pressable
                style={({ pressed }) => [
                  styles.menuRow,
                  pressed && styles.pressed,
                ]}
                onPress={() => {
                  if (item.label === "Notifications") {
                    router.push({
                      pathname: "/(tabs)/inbox",
                      params: { tab: "notifications" },
                    });
                  }
                }}
              >
                <SymbolView name={item.icon} size={18} tintColor={theme.text} />
                <ThemedText style={styles.menuLabel}>{item.label}</ThemedText>
                <SymbolView
                  name={{
                    ios: "chevron.right",
                    android: "chevron_right",
                    web: "chevron_right",
                  }}
                  size={12}
                  tintColor={theme.textSecondary}
                />
              </Pressable>
              {index < MENU_ITEMS.length - 1 && (
                <ThemedView
                  style={[
                    styles.divider,
                    { backgroundColor: theme.backgroundSelected },
                  ]}
                />
              )}
            </React.Fragment>
          ))}
        </ThemedView>

        <Pressable
          disabled={isSubmitting}
          onPress={handleLogout}
          style={({ pressed }) => [
            styles.logoutBtn,
            {
              backgroundColor: pressed ? "#ff4d4f" : "#ff5a5f",
              opacity: isSubmitting ? 0.7 : 1,
            },
          ]}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText style={styles.logoutText}>Logout</ThemedText>
          )}
        </Pressable>
      </View>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <ThemedText type="subtitle" style={styles.heading}>
          Profile
        </ThemedText>

        {authView === "loading" ? (
          <ThemedView style={styles.centered}>
            <ActivityIndicator size="large" color={Colors.light.primary} />
          </ThemedView>
        ) : authView === "guest" ? (
          renderAuthForms()
        ) : (
          renderProfileView()
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
  },
  heading: {
    marginTop: Spacing.five,
    marginBottom: Spacing.four,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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

  authForms: {
    flex: 1,
  },
  authScroll: {
    flex: 1,
  },
  authScrollContent: {
    paddingBottom: Spacing.two,
  },
  formFields: {
    gap: Spacing.three,
  },
  formFooter: {
    gap: Spacing.three,
    paddingTop: Spacing.two,
  },
  errorSlot: {
    minHeight: 20,
    justifyContent: "center",
  },
  formTitle: { marginBottom: Spacing.two },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 15,
  },
  errorText: {
    color: "#ff4d4f",
    fontWeight: "600",
  },
  submitBtn: {
    borderRadius: 16,
    paddingVertical: Spacing.three,
    alignItems: "center",
    justifyContent: "center",
  },
  submitText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  linkRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 4,
    paddingTop: Spacing.two,
  },

  roleRow: { gap: Spacing.two },
  rolePills: { flexDirection: "row", gap: Spacing.two },
  rolePill: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: Spacing.two,
    alignItems: "center",
    justifyContent: "center",
  },

  avatarCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.three,
    borderRadius: Spacing.three,
    marginBottom: Spacing.three,
    gap: Spacing.three,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "600",
  },
  avatarInfo: {
    flex: 1,
    gap: 2,
  },

  menuCard: {
    borderRadius: Spacing.three,
    overflow: "hidden",
    marginBottom: Spacing.three,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    gap: Spacing.three,
  },
  menuLabel: { flex: 1, fontSize: 15 },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: Spacing.three + 18 + Spacing.three,
  },
  pressed: { opacity: 0.6 },

  logoutBtn: {
    borderRadius: 16,
    paddingVertical: Spacing.three,
    alignItems: "center",
    justifyContent: "center",
  },
  logoutText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
