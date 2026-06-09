import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  ListRenderItemInfo,
  Platform,
  RefreshControlProps,
  StyleSheet,
  View,
} from "react-native";

import type { NewsUpdate } from "@/lib/supabase";
import { AnimatedNewsCard } from "./AnimatedNewsCard";

interface Props {
  data: NewsUpdate[];
  renderActions?: (item: NewsUpdate) => React.ReactNode;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  emptyComponent?: React.ReactElement;
  contentPaddingTop?: number;
  contentPaddingBottom?: number;
  cardHeight?: number;
}

function NewspaperFeedBase({
  data,
  renderActions,
  refreshControl,
  emptyComponent,
  contentPaddingTop = 0,
  contentPaddingBottom = 0,
  cardHeight,
}: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: Array<{ index: number | null }> }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 55 }).current;

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<NewsUpdate>) => (
      <AnimatedNewsCard
        item={item}
        shouldLoadImage
        height={cardHeight}
        renderActions={renderActions}
      />
    ),
    [renderActions, cardHeight]
  );

  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({
      length: cardHeight ?? 0,
      offset: (cardHeight ?? 0) * index + contentPaddingTop,
      index,
    }),
    [cardHeight, contentPaddingTop]
  );

  const dotsCount = Math.min(data.length, 7);
  const dotsStart = Math.max(0, Math.min(currentIndex - 3, data.length - dotsCount));

  return (
    <View style={styles.root}>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        snapToInterval={cardHeight}
        decelerationRate="fast"
        getItemLayout={cardHeight ? getItemLayout : undefined}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        contentContainerStyle={cardHeight ? undefined : { paddingTop: contentPaddingTop, paddingBottom: contentPaddingBottom }}
        refreshControl={refreshControl}
        removeClippedSubviews={Platform.OS === "android"}
        initialNumToRender={2}
        maxToRenderPerBatch={2}
        windowSize={5}
        ListEmptyComponent={emptyComponent}
      />

      {/* Progress dots — right side */}
      {cardHeight && data.length > 1 && (
        <View style={[styles.dotsWrap, { top: contentPaddingTop + (cardHeight * 0.25) }]} pointerEvents="none">
          {Array.from({ length: dotsCount }, (_, i) => {
            const absIdx   = dotsStart + i;
            const isActive = absIdx === currentIndex;
            return (
              <View key={absIdx} style={[styles.dot, isActive && styles.dotActive]} />
            );
          })}
        </View>
      )}
    </View>
  );
}

export const NewspaperFeed = memo(NewspaperFeedBase);

const styles = StyleSheet.create({
  root: { flex: 1 },
  dotsWrap: {
    position: "absolute",
    right: 12,
    gap: 5,
    alignItems: "center",
  },
  dot: {
    width: 3,
    height: 14,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  dotActive: {
    height: 22,
    backgroundColor: "#0a9b9a",
  },
});
