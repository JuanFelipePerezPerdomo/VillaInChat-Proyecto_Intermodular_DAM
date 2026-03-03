/**
 * Paleta de colores para tema claro y oscuro
 */

export const Colors = {
  light: {
    // Fondos
    background: "#FFFFFF",
    surface: "#F5F5F5",
    surfaceVariant: "#E8E8E8",

    // Textos
    text: "#1A1A1A",
    textSecondary: "#666666",
    textTertiary: "#999999",

    // Primarios
    primary: "#007AFF",
    primaryLight: "#4DA2FF",
    primaryDark: "#0055CC",

    // Estados
    error: "#DC3545",
    success: "#28A745",
    warning: "#FFC107",

    // Bordes y separadores
    border: "#E0E0E0",
    divider: "#EEEEEE",

    // Especiales
    favorite: "#FFD700",
    icon: "#666666",
    placeholder: "#AAAAAA",
    card: "#FFFFFF",
    tabs: "#ffffff",
  },

  dark: {
    // Fondos
    background: "#0c0c22",
    surface: "#1E1E1E",
    surfaceVariant: "#2C2C2C",

    // Textos
    text: "#FFFFFF",
    textSecondary: "#AAAAAA",
    textTertiary: "#777777",

    // Primarios
    primary: "#0A84FF",
    primaryLight: "#4DA2FF",
    primaryDark: "#0055CC",

    // Estados
    error: "#FF453A",
    success: "#32D74B",
    warning: "#FFD60A",

    // Bordes y separadores
    border: "#3A3A3A",
    divider: "#2C2C2C",

    // Especiales
    favorite: "#FFD700",
    icon: "#AAAAAA",
    placeholder: "#666666",
    card: "#24264e",
    tabs: "#181a33",
  },
} as const;

export type ColorScheme = "light" | "dark";
export type ThemeColors = {
  card: string | undefined;
  background: string;
  surface: string;
  surfaceVariant: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  primary: string;
  primaryLight: string;
  primaryDark: string;
  error: string;
  success: string;
  warning: string;
  border: string;
  divider: string;
  favorite: string;
  icon: string;
  placeholder: string;
  tabs: string;
};