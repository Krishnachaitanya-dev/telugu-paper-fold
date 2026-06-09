import React from 'react';
import { Text as RNText, type TextProps as RNTextProps } from 'react-native';
import { useTheme } from '../theme/useTheme';
import { textVariants } from '../tokens/typography';
import type { TextVariant } from '../tokens/typography';

type Tone = 'primary' | 'secondary' | 'inverse' | 'brand' | 'destructive';

interface TextProps extends RNTextProps {
  variant?: TextVariant;
  tone?: Tone;
}

export function Text({ variant = 'body', tone = 'primary', style, ...rest }: TextProps) {
  const { colors } = useTheme();

  const toneColor: Record<Tone, string> = {
    primary:     colors.textPrimary,
    secondary:   colors.textSecondary,
    inverse:     colors.primaryFg,
    brand:       colors.primary,
    destructive: colors.destructive,
  };

  return (
    <RNText
      style={[textVariants[variant], { color: toneColor[tone] }, style]}
      {...rest}
    />
  );
}
