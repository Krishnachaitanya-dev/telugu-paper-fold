import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from './Text';
import { useTheme } from '../theme/useTheme';
import { spacing } from '../tokens/spacing';
import { radius } from '../tokens/radius';

type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'destructive' | 'accent';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

export function Badge({ label, variant = 'primary' }: BadgeProps) {
  const { colors } = useTheme();

  const bgMap: Record<BadgeVariant, string> = {
    primary:     colors.primarySoft,
    secondary:   colors.muted,
    success:     '#dcfce7',
    warning:     '#fef3c7',
    destructive: colors.pinkSoft,
    accent:      colors.accentSoft,
  };
  const fgMap: Record<BadgeVariant, string> = {
    primary:     colors.primary,
    secondary:   colors.textSecondary,
    success:     '#15803d',
    warning:     '#92400e',
    destructive: colors.destructive,
    accent:      colors.accent,
  };

  return (
    <View style={[styles.badge, { backgroundColor: bgMap[variant], borderRadius: radius.full }]}>
      <Text variant="caption" style={{ color: fgMap[variant], fontWeight: '700' }}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing['2'],
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
});
