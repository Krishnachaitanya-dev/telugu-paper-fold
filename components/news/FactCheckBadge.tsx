import { Feather } from "@expo/vector-icons";
import React, { memo } from "react";
import { StyleSheet, Text, View } from "react-native";

export type FactCheckStatus = "verified" | "developing" | "unverified" | "factcheck";

interface Props {
  status: FactCheckStatus;
}

const CONFIG: Record<FactCheckStatus, { label: string; color: string; bg: string; icon: string }> = {
  verified:   { label: "Verified",   color: "#2ecc71", bg: "rgba(46,204,113,0.12)", icon: "check-circle" },
  developing: { label: "Developing", color: "#FFB020", bg: "rgba(255,176,32,0.12)",  icon: "clock" },
  unverified: { label: "Unverified", color: "#FF4D67", bg: "rgba(255,77,103,0.12)",  icon: "alert-circle" },
  factcheck:  { label: "Fact-check", color: "#8f6fe0", bg: "rgba(143,111,224,0.12)", icon: "search" },
};

function FactCheckBadgeBase({ status }: Props) {
  const c = CONFIG[status];
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Feather name={c.icon as any} size={11} color={c.color} />
      <Text style={[styles.label, { color: c.color }]}>{c.label}</Text>
    </View>
  );
}

export const FactCheckBadge = memo(FactCheckBadgeBase);

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  label: { fontSize: 10, fontWeight: "800", letterSpacing: 0.3 },
});
