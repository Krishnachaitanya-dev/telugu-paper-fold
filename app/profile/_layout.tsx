import { Stack } from "expo-router";
import React from "react";

import { useColors } from "@/hooks/useColors";

export default function ProfileLayout() {
  const colors = useColors();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.primary,
        headerTitleStyle: { color: colors.foreground, fontWeight: "700" },
        headerBackTitle: "Back",
        headerShadowVisible: false,
      }}
    />
  );
}
