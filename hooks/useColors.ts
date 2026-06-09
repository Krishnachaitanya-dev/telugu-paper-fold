import { useColorScheme } from "react-native";
import { useMemo } from "react";

import colors from "@/constants/colors";

/**
 * Returns stable design tokens for the current color scheme.
 * The memo matters because this hook is used in many list rows.
 */
export function useColors() {
  const scheme = useColorScheme();

  return useMemo(() => {
    // Force light theme always
    void scheme;
    return { ...colors.light, radius: colors.radius };
  }, [scheme]);
}
