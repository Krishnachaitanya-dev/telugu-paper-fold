import Constants from "expo-constants";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { router, Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { Feather, MaterialCommunityIcons, Ionicons, MaterialIcons, FontAwesome } from "@expo/vector-icons";
import * as Sentry from "@sentry/react-native";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { registerForPushNotifications } from "@/lib/notifications";
import { logger, Logger } from "@/core/logger";
import { sentryTransport } from "@/core/logger/sentryTransport";
import { setAnalyticsClient } from "@/core/analytics/analytics";
import { createPostHogClient } from "@/core/analytics/posthogClient";
import { env } from "@/core/env/env";
import { backoffWithJitter } from "@/core/resilience/backoff";
import { ToastProvider } from "@/shared/feedback/ToastProvider";

// Initialize Sentry before any rendering
if (env.sentryDsn && !__DEV__) {
  Sentry.init({ dsn: env.sentryDsn, environment: env.appEnv });
  (logger as Logger).addTransport(sentryTransport);
} else if (!env.sentryDsn) {
  logger.warn("Sentry not initialised - EXPO_PUBLIC_SENTRY_DSN missing");
}

// Initialize PostHog analytics
if (env.posthogApiKey && !__DEV__) {
  setAnalyticsClient(createPostHogClient(env.posthogApiKey));
} else if (!env.posthogApiKey) {
  logger.warn("PostHog not initialised - EXPO_PUBLIC_POSTHOG_API_KEY missing");
}

// Side-effect: set the global notification handler before any component mounts.
// Guard is inside the module — safe to import even in Expo Go.
import "@/lib/notifications";

SplashScreen.preventAutoHideAsync().catch(() => {});

const APP_LOGO = require("../assets/images/logo.jpeg");
const SPLASH_DURATION_MS = 2700;

// ─── Expo Go detection (mirrored from lib/notifications.ts) ──────────────────
const IS_EXPO_GO =
  Constants.appOwnership === "expo" ||
  (Constants as Record<string, unknown>).executionEnvironment === "storeClient";

// Subscription type — only used as a type, so we define it inline
type NotifSubscription = { remove: () => void };

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 12 * 60 * 60 * 1000,
      retry: 2,
      // Exponential backoff with full jitter — avoids retry storms after an outage.
      retryDelay: (attempt) => backoffWithJitter(attempt, 300, 10_000),
      refetchOnMount: false,
      refetchOnReconnect: true,
      refetchOnWindowFocus: false,
    },
  },
});

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="profile" options={{ headerShown: false }} />
      <Stack.Screen name="chat" options={{ headerShown: false }} />
      <Stack.Screen name="search" options={{ headerShown: false, presentation: "modal" }} />
    </Stack>
  );
}

export default function RootLayout() {
  const foregroundSub = useRef<NotifSubscription | null>(null);
  const responseSub = useRef<NotifSubscription | null>(null);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
    const timer = setTimeout(() => setShowSplash(false), SPLASH_DURATION_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Skip all notification setup when running inside Expo Go.
    if (IS_EXPO_GO) return;

    registerForPushNotifications().catch(() => {});

    import("expo-notifications")
      .then((Notifications) => {
        try {
          foregroundSub.current = Notifications.addNotificationReceivedListener(
            (notification) => {
              console.log(
                "[Notification] Received:",
                notification.request.content.title
              );
            }
          );

          responseSub.current = Notifications.addNotificationResponseReceivedListener(
            (response) => {
              const data = response.notification.request.content.data as
                | Record<string, string>
                | undefined;
              if (data?.screen === "reels") {
                router.push("/(tabs)/reels" as never);
              } else if (data?.screen === "live") {
                router.push("/(tabs)/live" as never);
              } else {
                router.push("/(tabs)" as never);
              }
            }
          );
        } catch {
          // Not supported in this environment.
        }
      })
      .catch(() => {});

    return () => {
      foregroundSub.current?.remove();
      responseSub.current?.remove();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <ToastProvider>
                <RootLayoutNav />
                {showSplash ? <BrandedSplash /> : null}
              </ToastProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

function BrandedSplash() {
  const breath = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, {
          toValue: 1,
          duration: 1050,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(breath, {
          toValue: 0,
          duration: 1050,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [breath]);

  const logoScale = breath.interpolate({
    inputRange: [0, 1],
    outputRange: [0.98, 1.04],
  });
  const logoOpacity = breath.interpolate({
    inputRange: [0, 1],
    outputRange: [0.94, 1],
  });

  return (
    <View style={styles.splashOverlay}>
      <View style={styles.splashCenter}>
        <Animated.Image
          source={APP_LOGO}
          style={[
            styles.splashLogo,
            { opacity: logoOpacity, transform: [{ scale: logoScale }] },
          ]}
          resizeMode="contain"
        />
        <Text style={styles.splashTitle}>తెలుగు వార్తలు</Text>
      </View>
      <Text style={styles.splashTagline}>9+ కోట్ల తెలుగు ప్రజల కోసం ❤️</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  splashOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    elevation: 999,
    backgroundColor: "#0d1320",
    alignItems: "center",
    justifyContent: "center",
  },
  splashCenter: {
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  splashLogo: {
    width: 280,
    height: 280,
  },
  splashTitle: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 0,
  },
  splashTagline: {
    position: "absolute",
    bottom: 42,
    left: 20,
    right: 20,
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: 0,
  },
});
