import React from 'react';
import {
  Pressable,
  ActivityIndicator,
  type PressableProps,
  type ViewStyle,
  type TextStyle,
  StyleSheet,
  View,
} from 'react-native';
import { Text } from './Text';
import { useTheme } from '../theme/useTheme';
import { spacing } from '../tokens/spacing';
import { radius } from '../tokens/radius';
import { shadows } from '../tokens/shadows';

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends PressableProps {
  label: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: React.ReactNode;
}

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const { colors } = useTheme();
  const isDisabled = disabled || loading;

  const bg: Record<Variant, string> = {
    primary:     colors.primary,
    secondary:   colors.muted,
    ghost:       'transparent',
    destructive: colors.destructive,
  };

  const labelColor: Record<Variant, string> = {
    primary:     colors.primaryFg,
    secondary:   colors.textPrimary,
    ghost:       colors.textPrimary,
    destructive: '#ffffff',
  };

  const heights: Record<Size, number> = { sm: 36, md: 44, lg: 52 };
  const paddings: Record<Size, number> = { sm: spacing['3'], md: spacing['4'], lg: spacing['5'] };

  const containerStyle: ViewStyle = {
    backgroundColor: bg[variant],
    height: heights[size],
    paddingHorizontal: paddings[size],
    borderRadius: radius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing['2'],
    opacity: isDisabled ? 0.5 : 1,
    ...shadows.sm,
  };

  const labelStyle: TextStyle = {
    color: labelColor[variant],
  };

  return (
    <Pressable
      style={({ pressed }) => [containerStyle, pressed && styles.pressed, style as ViewStyle]}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator size="small" color={labelColor[variant]} />
      ) : (
        <>
          {leftIcon && <View>{leftIcon}</View>}
          <Text variant="label" style={labelStyle}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.75 },
});
