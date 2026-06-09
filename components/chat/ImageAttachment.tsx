/**
 * ImageAttachment — chat image picker button + preview.
 * Currently shows "coming soon" state. TODO: implement actual upload when backend ready.
 */
import { Feather } from "@expo/vector-icons";
import React, { memo } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface Props {
  enabled?: boolean;
  style?: object;
}

function ImageAttachmentBase({ enabled = false, style }: Props) {
  const handlePress = () => {
    if (!enabled) {
      Alert.alert("Coming soon", "Image sharing will be available in a future update.");
      return;
    }
    // TODO: launch image picker when backend is ready
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      style={[styles.btn, style]}
      accessibilityLabel={enabled ? "Attach image" : "Image sharing coming soon"}
    >
      <Feather name="image" size={20} color={enabled ? "#F97316" : "rgba(255,255,255,0.35)"} />
      {!enabled && (
        <View style={styles.comingSoonDot} />
      )}
    </TouchableOpacity>
  );
}

export const ImageAttachment = memo(ImageAttachmentBase);

const styles = StyleSheet.create({
  btn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  comingSoonDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FFB020",
  },
});
