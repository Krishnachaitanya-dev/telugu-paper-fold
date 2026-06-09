import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton } from './Skeleton';
import { useTheme } from '@/design/theme/useTheme';
import { spacing } from '@/design/tokens/spacing';

export function NewsCardSkeleton({ height }: { height: number }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.root, { height, backgroundColor: colors.bg }]}>
      <Skeleton width="100%" height={height * 0.43} borderRadius={0} />
      <View style={styles.body}>
        <Skeleton width={80} height={12} borderRadius={4} />
        <Skeleton width="90%" height={24} borderRadius={6} style={{ marginTop: spacing['2'] }} />
        <Skeleton width="75%" height={20} borderRadius={6} />
        <Skeleton width={120} height={14} borderRadius={4} style={{ marginTop: spacing['3'] }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { overflow: 'hidden' },
  body: { padding: spacing['5'], gap: spacing['2'] },
});
