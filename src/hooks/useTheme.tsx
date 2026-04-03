import { Colors, type ColorScheme, type ThemeColors } from "@/src/themes";
import { useColorScheme } from "react-native";
import { useSettingsStore } from "../stores";

/**
 * Hook para acceder a los colores del tema actual
 */
export function useTheme() {
  const systemColorScheme = useColorScheme();
  const themePreferences = useSettingsStore((s) => s.theme);

  const colorScheme: ColorScheme = 
    themePreferences === "system"
    ? systemColorScheme ?? "light"
    : themePreferences;

  const colors: ThemeColors = Colors[colorScheme];

  return {
    colors,
    colorScheme,
    isDark: colorScheme === "dark",
  };
}