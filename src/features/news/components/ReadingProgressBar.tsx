import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { useTheme } from '@/design/theme/useTheme';

interface Props {
  contentHeight: number;
  layoutHeight: number;
}

export function useReadingProgress() {
  const scrollOffset = useSharedValue(0);
  const contentHeight = useSharedValue(0);
  const layoutHeight = useSharedValue(0);

  const onScroll = useAnimatedScrollHandler((e) => {
    scrollOffset.value = e.contentOffset.y;
    contentHeight.value = e.contentSize.height;
    layoutHeight.value = e.layoutMeasurement.height;
  });

  const progressStyle = useAnimatedStyle(() => {
    const max = contentHeight.value - layoutHeight.value;
    const progress = max > 0 ? interpolate(scrollOffset.value, [0, max], [0, 1], Extrapolation.CLAMP) : 0;
    return { width: `${progress * 100}%` as `${number}%` };
  });

  return { onScroll, progressStyle };
}

export function ReadingProgressBar({ progressStyle }: { progressStyle: ReturnType<typeof useReadingProgress>['progressStyle'] }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.track, { backgroundColor: colors.border }]} pointerEvents="none">
      <Animated.View style={[styles.fill, { backgroundColor: colors.primary }, progressStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 3, width: '100%' },
  fill:  { height: '100%' },
});
