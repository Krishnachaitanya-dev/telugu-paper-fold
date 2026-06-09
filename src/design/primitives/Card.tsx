import React from 'react';
import { View, type ViewProps } from 'react-native';
import { useTheme } from '../theme/useTheme';
import { radius } from '../tokens/radius';
import { shadows } from '../tokens/shadows';

interface CardProps extends ViewProps {
  elevated?: boolean;
}

export function Card({ elevated = false, style, children, ...rest }: CardProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: colors.card,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          ...(elevated ? shadows.md : {}),
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}
