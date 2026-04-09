/**
 * Paleta de colores para tema claro y oscuro
 */

export const Colors = {
  light: {
    // Fondos
    background: "#e7decc",
    surface: "#2e8a70",
    surfaceVariant: "#2e8a70",

    // Textos
    text: "#1a1a1a",
    textSecondary: "#4a4a4a",
    textTertiary: "#888888",

    // Primarios
    primary: "#2e8a70",
    primaryLight: "#2e8a70",
    primaryDark: "#c2e0e0",

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
    placeholder: "#888888",
    onPrimary: "#ffffff",
    onPrimaryHover: "#000000",
    card: "#c2e0e0",
    tabs: "#c2e0e0",
  },

  dark: {
    // Fondos
    background: "#0c0c22",
    surface: "#1E1E1E",
    surfaceVariant: "#2C2C2C",

    // Textos
    text: "#c2e0e0",
    textSecondary: "#AAAAAA",
    textTertiary: "#777777",

    // Primarios
    primary: "#5f547d",
    primaryLight: "#4DA2FF",
    primaryDark: "#2e8a70",

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
    onPrimary: "#c2e0e0",
    onPrimaryHover: "#000000",
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
  onPrimary: string;
  onPrimaryHover: string;
  tabs: string;
};