import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";

import { useColors } from "@/hooks/useColors";

function SkeletonBox({ width, height, borderRadius = 8, style }: {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: object;
}) {
  const colors = useColors();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [anim]);

  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.9] });

  return (
    <Animated.View
      style={[
        { width: width as number, height, borderRadius, backgroundColor: colors.border, opacity },
        style,
      ]}
    />
  );
}

export function NewsSkeletonCard() {
  const colors = useColors();
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <SkeletonBox width="100%" height={180} borderRadius={10} />
      <View style={styles.body}>
        <SkeletonBox width="30%" height={16} borderRadius={8} />
        <SkeletonBox width="100%" height={18} borderRadius={6} style={{ marginTop: 8 }} />
        <SkeletonBox width="80%" height={18} borderRadius={6} style={{ marginTop: 4 }} />
        <View style={styles.row}>
          <SkeletonBox width={80} height={13} borderRadius={6} />
          <SkeletonBox width={60} height={13} borderRadius={6} />
        </View>
      </View>
    </View>
  );
}

export function ReelSkeletonCard() {
  const colors = useColors();
  return (
    <View style={[styles.reelCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <SkeletonBox width={120} height={90} borderRadius={10} />
      <View style={styles.reelBody}>
        <SkeletonBox width="80%" height={14} borderRadius={6} />
        <SkeletonBox width="50%" height={12} borderRadius={6} style={{ marginTop: 6 }} />
        <SkeletonBox width="30%" height={12} borderRadius={6} style={{ marginTop: 4 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    marginHorizontal: 16,
    marginBottom: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  body: { padding: 14, gap: 4 },
  row: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  reelCard: {
    flexDirection: "row",
    borderRadius: 14,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    overflow: "hidden",
    padding: 10,
    gap: 12,
  },
  reelBody: { flex: 1, justifyContent: "center", gap: 4 },
});
