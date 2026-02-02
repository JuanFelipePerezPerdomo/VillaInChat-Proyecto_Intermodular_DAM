import { TextStyle } from "react-native";

/**
 * Tamaños de fuente
 */
export const FontSize = {
  /** 12px */
  xs: 12,
  /** 14px */
  sm: 14,
  /** 16px */
  md: 16,
  /** 18px */
  lg: 18,
  /** 20px */
  xl: 20,
  /** 24px */
  xxl: 24,
  /** 32px */
  xxxl: 32,
} as const;

/**
 * Pesos de fuente
 */
export const FontWeight = {
  regular: "400" as TextStyle["fontWeight"],
  medium: "500" as TextStyle["fontWeight"],
  semibold: "600" as TextStyle["fontWeight"],
  bold: "700" as TextStyle["fontWeight"],
} as const;

/**
 * Estilos de texto predefinidos
 */
export const Typography = {
  // Títulos
  h1: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.bold,
    lineHeight: 40,
  },
  h2: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    lineHeight: 32,
  },
  h3: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.semibold,
    lineHeight: 28,
  },

  // Cuerpo
  body: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.regular,
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.regular,
    lineHeight: 20,
  },

  // Labels
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    lineHeight: 20,
  },
  labelSmall: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    lineHeight: 16,
  },

  // Botones
  button: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    lineHeight: 24,
  },
  buttonSmall: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    lineHeight: 20,
  },

  // Caption
  caption: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.regular,
    lineHeight: 16,
  },
} as const;

export type TypographyKey = keyof typeof Typography;