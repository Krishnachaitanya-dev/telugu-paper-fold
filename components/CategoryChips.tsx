import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";

const CATEGORIES = [
  "All",
  "Top",
  "Jobs",
  "Districts",
  "Movies",
  "TTD",
  "Exams",
  "Sports",
  "Politics",
  "Business",
];

interface Props {
  selected: string;
  onSelect: (cat: string) => void;
}

export function CategoryChips({ selected, onSelect }: Props) {
  const colors = useColors();
  return (
    <View style={[styles.wrapper, { borderBottomColor: colors.border }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {CATEGORIES.map((cat) => {
          const active = cat === selected;
          return (
            <TouchableOpacity
              key={cat}
              onPress={() => onSelect(cat)}
              activeOpacity={0.7}
              style={[
                styles.chip,
                {
                  backgroundColor: active ? colors.primary : colors.muted,
                  borderColor: active ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: active ? colors.primaryForeground : colors.mutedForeground },
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderBottomWidth: 1,
    paddingBottom: 0,
  },
  row: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    flexDirection: "row",
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
  },
});
