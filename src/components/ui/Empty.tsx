import React from "react";
import { StyleSheet, Text, TextStyle, View, ViewStyle } from "react-native";

// Tokens de color (ajústalos a tu tema)
const colors = {
  muted: "#f1f5f9",
  mutedForeground: "#64748b",
  foreground: "#0f172a",
  border: "#e2e8f0",
};

// ─── Empty ───────────────────────────────────────────────
type EmptyProps = {
  children?: React.ReactNode;
  style?: ViewStyle;
};

export function Empty({ children, style }: EmptyProps) {
  return (
    <View style={[styles.empty, style]}>
      {children}
    </View>
  );
}

// ─── EmptyHeader ─────────────────────────────────────────
type EmptyHeaderProps = {
  children?: React.ReactNode;
  style?: ViewStyle;
};

export function EmptyHeader({ children, style }: EmptyHeaderProps) {
  return (
    <View style={[styles.emptyHeader, style]}>
      {children}
    </View>
  );
}

// ─── EmptyMedia ──────────────────────────────────────────
type EmptyMediaVariant = "default" | "icon";

type EmptyMediaProps = {
  children?: React.ReactNode;
  variant?: EmptyMediaVariant;
  style?: ViewStyle;
};

export function EmptyMedia({ children, variant = "default", style }: EmptyMediaProps) {
  return (
    <View
      style={[
        styles.emptyMediaBase,
        variant === "icon" ? styles.emptyMediaIcon : styles.emptyMediaDefault,
        style,
      ]}
    >
      {children}
    </View>
  );
}

// ─── EmptyTitle ──────────────────────────────────────────
type EmptyTitleProps = {
  children?: React.ReactNode;
  style?: TextStyle;
};

export function EmptyTitle({ children, style }: EmptyTitleProps) {
  return (
    <Text style={[styles.emptyTitle, style]}>
      {children}
    </Text>
  );
}

// ─── EmptyDescription ────────────────────────────────────
type EmptyDescriptionProps = {
  children?: React.ReactNode;
  style?: TextStyle;
};

export function EmptyDescription({ children, style }: EmptyDescriptionProps) {
  return (
    <Text style={[styles.emptyDescription, style]}>
      {children}
    </Text>
  );
}

// ─── EmptyContent ─────────────────────────────────────────
type EmptyContentProps = {
  children?: React.ReactNode;
  style?: ViewStyle;
};

export function EmptyContent({ children, style }: EmptyContentProps) {
  return (
    <View style={[styles.emptyContent, style]}>
      {children}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────
const styles = StyleSheet.create({
  empty: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.border,
    padding: 24,
  },
  emptyHeader: {
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
    maxWidth: 384,
  },
  emptyMediaBase: {
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  emptyMediaDefault: {
    backgroundColor: "transparent",
  },
  emptyMediaIcon: {
    backgroundColor: colors.muted,
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "500",
    letterSpacing: -0.3,
    color: colors.foreground,
    textAlign: "center",
  },
  emptyDescription: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.mutedForeground,
    textAlign: "center",
  },
  emptyContent: {
    flexDirection: "column",
    alignItems: "center",
    gap: 16,
    width: "100%",
    maxWidth: 384,
  },
});

