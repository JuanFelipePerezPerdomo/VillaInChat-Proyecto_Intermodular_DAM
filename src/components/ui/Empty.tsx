import { useTheme } from "@/src/hooks";
import React from "react";
import { StyleSheet, Text, TextStyle, View, ViewStyle } from "react-native";

// ─── Empty ───────────────────────────────────────────────
type EmptyProps = {
  children?: React.ReactNode;
  style?: ViewStyle;
};

export function Empty({ children, style }: EmptyProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.empty, { borderColor: colors.border }, style]}>
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
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.emptyMediaBase,
        variant === "icon" ? [styles.emptyMediaIcon, { backgroundColor: colors.surface }] : styles.emptyMediaDefault,
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
  const { colors } = useTheme();
  return (
    <Text style={[styles.emptyTitle, { color: colors.text }, style]}>
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
  const { colors } = useTheme();
  return (
    <Text style={[styles.emptyDescription, { color: colors.textSecondary }, style]}>
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
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "500",
    letterSpacing: -0.3,
    textAlign: "center",
  },
  emptyDescription: {
    fontSize: 14,
    lineHeight: 22,
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
