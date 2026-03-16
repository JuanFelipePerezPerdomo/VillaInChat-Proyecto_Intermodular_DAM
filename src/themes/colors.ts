/**
 * Paleta de colores para tema claro y oscuro
 */

export const Colors = {
  light: {
    // Fondos
    background: "#c2e0e0",
    surface: "#d4eaea",
    surfaceVariant: "#b0d4d4",

    // Textos
    text: "#1a3a3a",
    textSecondary: "#2e6a5a",
    textTertiary: "#ffffff",

    // Primarios
    primary: "#2e8a70",
    primaryLight: "#3da882",
    primaryDark: "#1f6b55",

    // Estados
    error: "#DC3545",
    success: "#28A745",
    warning: "#FFC107",

    // Bordes y separadores
    border: "#a0cfc0",
    divider: "#b5d8d0",

    // Especiales
    favorite: "#FFD700",
    icon: "#2e8a70",
    placeholder: "#6aab9a",
    card: "#2e8a70",
    tabs: "#c2e0e0",
  },

  dark: {
    // Fondos
    background: "#32214f",
    surface: "#3d2d5e",
    surfaceVariant: "#4a3a6a",

    // Textos
    text: "#c2e0e0",
    textSecondary: "#a0c0c0",
    textTertiary: "#c2e0e0",

    // Primarios
    primary: "#5f547d",
    primaryLight: "#7a6f96",
    primaryDark: "#4a3f68",

    // Estados
    error: "#FF453A",
    success: "#32D74B",
    warning: "#FFD60A",

    // Bordes y separadores
    border: "#5f547d",
    divider: "#4a3a6a",

    // Especiales
    favorite: "#FFD700",
    icon: "#c2e0e0",
    placeholder: "#8a7fa5",
    card: "#5f547d",
    tabs: "#32214f",
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