import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Text } from '@/design/primitives/Text';
import { Button } from '@/design/primitives/Button';
import { useTheme } from '@/design/theme/useTheme';
import { spacing } from '@/design/tokens/spacing';

type IconName = keyof typeof Feather.glyphMap;

interface EmptyStateProps {
  icon?: IconName;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon = 'inbox', title, subtitle, actionLabel, onAction }: EmptyStateProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.root}>
      <View style={[styles.iconWrap, { backgroundColor: colors.primarySoft }]}>
        <Feather name={icon} size={28} color={colors.primary} />
      </View>
      <Text variant="title" style={{ textAlign: 'center', marginTop: spacing['3'] }}>{title}</Text>
      {subtitle && (
        <Text variant="body" tone="secondary" style={{ textAlign: 'center', marginTop: spacing['1'] }}>
          {subtitle}
        </Text>
      )}
      {actionLabel && onAction && (
        <Button label={actionLabel} onPress={onAction} size="md" style={{ marginTop: spacing['5'] }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root:     { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing['6'] },
  iconWrap: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
