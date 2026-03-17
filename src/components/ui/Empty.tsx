import { useTheme } from "@/src/hooks";
import { BorderRadius, Spacing, Typography } from "@/src/themes";
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
        variant === "icon" ? [styles.emptyMediaIcon, { backgroundColor: colors.surfaceVariant }] : styles.emptyMediaDefault,
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
    gap: Spacing.xl,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderStyle: "dashed",
    padding: Spacing.xl,
  },
  emptyHeader: {
    flexDirection: "column",
    alignItems: "center",
    gap: Spacing.sm,
    maxWidth: 384,
  },
  emptyMediaBase: {
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  emptyMediaDefault: {
    backgroundColor: "transparent",
  },
  emptyMediaIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
  },
  emptyTitle: {
    ...Typography.h3,
    textAlign: "center",
  },
  emptyDescription: {
    ...Typography.bodySmall,
    textAlign: "center",
  },
  emptyContent: {
    flexDirection: "column",
    alignItems: "center",
    gap: Spacing.lg,
    width: "100%",
    maxWidth: 384,
  },
});
