import { Tabs, router, usePathname } from "expo-router";
import React, { useEffect, useMemo } from "react";
import { Image, PanResponder, Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { markTabsMounted } from "@/lib/tabMountStatus";

const TAB_ICONS = {
  news:    require("../../assets/tab-icons/icon-news.png"),
  reels:   require("../../assets/tab-icons/icon-reels.png"),
  live:    require("../../assets/tab-icons/icon-live.png"),
  chat:    require("../../assets/tab-icons/icon-chat.png"),
  profile: require("../../assets/tab-icons/icon-profile.png"),
} as const;

const TAB_ORDER: readonly string[] = ["/", "/reels", "/live", "/chat", "/profile"];
const TAB_PATHS = [
  "/(tabs)",
  "/(tabs)/reels",
  "/(tabs)/live",
  "/(tabs)/chat",
  "/(tabs)/profile",
] as const;

function currentTabIndex(pathname: string) {
  if (pathname.includes("/profile")) return 4;
  if (pathname.includes("/chat"))    return 3;
  if (pathname.includes("/live"))    return 2;
  if (pathname.includes("/reels"))   return 1;
  return 0;
}

// ─── Icon components ──────────────────────────────────────────────────────────

function TabIcon({
  name,
  color,
  focused,
}: {
  name: keyof typeof TAB_ICONS;
  color: string;
  focused: boolean;
}) {
  const size = name === "reels" ? 28 : 24;
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Image
        source={TAB_ICONS[name]}
        resizeMode="contain"
        style={[
          styles.tabIcon,
          { width: size, height: size, tintColor: color },
        ]}
      />
    </View>
  );
}

function NewsTabIcon({ color, focused }: { color: string; focused: boolean }) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Image
        source={TAB_ICONS.news}
        resizeMode="contain"
        style={[styles.tabIcon, { width: 24, height: 24, tintColor: color }]}
      />
    </View>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function TabLayout() {
  const colors  = useColors();
  const insets  = useSafeAreaInsets();
  const pathname = usePathname();
  const isWeb   = Platform.OS === "web";

  useEffect(() => { markTabsMounted("TabLayout"); }, []);

  const safeBottom  = isWeb ? 0 : Math.max(insets.bottom, Platform.OS === "android" ? 20 : 0);
  const tabBarHeight = isWeb ? 84 : 58 + safeBottom;

  const swipeResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) =>
          Math.abs(g.dx) > 45 && Math.abs(g.dx) > Math.abs(g.dy) * 1.6,
        onPanResponderRelease: (_, g) => {
          const idx = currentTabIndex(pathname);
          if (g.dx < -65 && idx < TAB_ORDER.length - 1)
            router.navigate(TAB_PATHS[idx + 1] as never);
          else if (g.dx > 65 && idx > 0)
            router.navigate(TAB_PATHS[idx - 1] as never);
        },
      }),
    [pathname]
  );

  return (
    <View style={styles.swipeRoot} {...swipeResponder.panHandlers}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor:   colors.primary,
          tabBarInactiveTintColor: "rgba(255,255,255,0.85)",
          headerShown:        false,
          lazy:               true,
          tabBarHideOnKeyboard: true,
          tabBarLabelStyle:   styles.tabLabel,
          tabBarItemStyle:    styles.tabItem,
          tabBarStyle: {
            backgroundColor: "#0d1320",
            borderTopWidth:   3,
            borderTopColor:   "#0a9b9a",
            elevation:        0,
            shadowOpacity:    0,
            height:           tabBarHeight,
            paddingTop:       6,
            paddingBottom:    isWeb ? 12 : safeBottom + 4,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "News",
            tabBarIcon: ({ color, focused }) => (
              <NewsTabIcon color={color} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="reels"
          options={{
            title: "Reels",
            tabBarIcon: ({ color, focused }) => (
              <TabIcon name="reels" color={color} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="live"
          options={{
            title: "Live",
            tabBarIcon: ({ color, focused }) => (
              <TabIcon name="live" color={color} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="chat"
          options={{
            title: "Chat",
            tabBarIcon: ({ color, focused }) => (
              <TabIcon name="chat" color={color} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, focused }) => (
              <TabIcon name="profile" color={color} focused={focused} />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  swipeRoot: { flex: 1 },

  // Generic tab icon wrap — shows orange pill when focused
  iconWrap: {
    width: 40,
    height: 30,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapActive: {
    backgroundColor: "rgba(10,155,154,0.12)",
  },

  // News tab — slightly wider pill
  newsIconWrap: {
    width: 42,
    height: 30,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  newsIconWrapActive: {
    backgroundColor: "rgba(10,155,154,0.12)",
  },

  tabIcon: { marginBottom: 1 },
  tabLabel: {
    fontSize: 10,
    fontWeight: "700",
    marginTop: 1,
    letterSpacing: 0.1,
  },
  tabItem: { paddingVertical: 2 },
});
