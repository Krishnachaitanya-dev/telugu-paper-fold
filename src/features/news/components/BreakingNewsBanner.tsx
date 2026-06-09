import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { Text } from '@/design/primitives/Text';
import { useTheme } from '@/design/theme/useTheme';
import { spacing } from '@/design/tokens/spacing';
import { analytics } from '@/core/analytics/analytics';
import type { NewsUpdate } from '../model/news.schema';

interface Props {
  item: NewsUpdate;
  onPress: (item: NewsUpdate) => void;
  onDismiss: () => void;
}

export function BreakingNewsBanner({ item, onPress, onDismiss }: Props) {
  const { colors } = useTheme();
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.06, duration: 500, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,    duration: 500, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [pulse]);

  return (
    <Animated.View style={[styles.root, { backgroundColor: colors.destructive, transform: [{ scaleX: pulse }] }]}>
      <Pressable style={styles.inner} onPress={() => {
        analytics.track('breaking_news_tapped', { id: item.id });
        onPress(item);
      }}>
        <View style={styles.label}>
          <Feather name="zap" size={12} color="#fff" />
          <Text variant="caption" style={{ color: '#fff', fontWeight: '800', letterSpacing: 1 }}>BREAKING</Text>
        </View>
        <Text variant="label" style={[styles.title, { color: '#fff' }]} numberOfLines={1}>
          {item.title}
        </Text>
      </Pressable>
      <Pressable onPress={onDismiss} style={styles.close} testID="breaking-news-close">
        <Feather name="x" size={14} color="rgba(255,255,255,0.8)" />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root:  { flexDirection: 'row', alignItems: 'center', paddingLeft: spacing['4'], paddingRight: spacing['1'], paddingVertical: spacing['2'] },
  inner: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing['2'] },
  label: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  title: { flex: 1 },
  close: { padding: spacing['3'] },
});
