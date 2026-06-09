/**
 * AdSlot — placeholder for future Google Ads integration.
 * Renders a clean, clearly-marked ad container that doesn't intrude on content.
 * TODO: replace View with BannerAd from react-native-google-mobile-ads when configured.
 */
import { Feather } from "@expo/vector-icons";
import React, { memo } from "react";
import { StyleSheet, Text, View } from "react-native";

interface Props {
  style?: object;
}

function AdSlotBase({ style }: Props) {
  return (
    <View style={[styles.container, style]}>
      <Feather name="image" size={18} color="rgba(255,255,255,0.2)" />
      <Text style={styles.label}>Advertisement</Text>
    </View>
  );
}

export const AdSlot = memo(AdSlotBase);

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 14,
    height: 60,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.03)",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  label: { color: "rgba(255,255,255,0.2)", fontSize: 11, fontWeight: "600", letterSpacing: 0.5 },
});
