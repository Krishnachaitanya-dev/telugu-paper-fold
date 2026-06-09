import { Platform } from 'react-native';

type Shadow = {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
};

function shadow(
  opacity: number,
  shadowRadius: number,
  elevation: number,
): Shadow {
  return {
    shadowColor: Platform.OS === 'ios' ? '#000' : '#000',
    shadowOffset: { width: 0, height: shadowRadius / 3 },
    shadowOpacity: opacity,
    shadowRadius,
    elevation,
  };
}

export const shadows = {
  sm: shadow(0.05, 4,  2),
  md: shadow(0.08, 8,  4),
  lg: shadow(0.12, 12, 8),
  xl: shadow(0.18, 20, 12),
} as const;
