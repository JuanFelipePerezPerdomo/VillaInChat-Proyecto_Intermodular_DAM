import { Colors, type ColorScheme, type ThemeColors } from "@/src/themes";
import { useColorScheme } from "react-native";

/**
 * Hook para acceder a los colores del tema actual
 */
export function useTheme() {
  const systemColorScheme = useColorScheme();
  const colorScheme: ColorScheme = systemColorScheme ?? "light";

  const colors: ThemeColors = Colors[colorScheme];

  return {
    colors,
    colorScheme,
    isDark: colorScheme === "dark",
  };
}