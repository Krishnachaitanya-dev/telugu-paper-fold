import { useColorScheme } from 'react-native';
import { useMemo } from 'react';
import { lightColors, darkColors, radius } from '../tokens';
import type { ColorToken } from '../tokens/colors';

export interface Theme {
  colors: ColorToken;
  radius: typeof radius;
  isDark: boolean;
}

export function useTheme(): Theme {
  const scheme = useColorScheme();
  return useMemo(() => ({
    colors: scheme === 'dark' ? darkColors : lightColors,
    radius,
    isDark: scheme === 'dark',
  }), [scheme]);
}
