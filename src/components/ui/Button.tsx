import { useTheme } from "@/src/hooks/useTheme";
import { BorderRadius, Spacing, Typography } from "@/src/themes";
import { useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    TextStyle,
    ViewStyle,
} from "react-native";

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: "primary" | "secondary" | "outline" | "ghost";
    size?: "small" | "medium" | "large";
    disabled?: boolean;
    loading?: boolean;
    fullWidth?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
}

export function Button({
    title,
    onPress,
    variant = "primary",
    size = "medium",
    disabled = false,
    loading = false,
    fullWidth = false,
    style,
    textStyle,
}: ButtonProps) {
    const { colors } = useTheme();
    const [hovered, setHovered] = useState(false);

    const isDisabled = disabled || loading;

    const getBackgroundColor = () => {
        if (isDisabled) return colors.surfaceVariant;
        switch (variant) {
            case "primary":
                return hovered ? colors.primaryDark : colors.primary;
            case "secondary":
                return hovered ? colors.surfaceVariant : colors.surface;
            case "outline":
            case "ghost":
                return hovered ? colors.surface : "transparent";
            default:
                return hovered ? colors.primaryDark : colors.primary;
        }
    };

    const getTextColor = () => {
        if (isDisabled) return colors.textTertiary;
        switch (variant) {
            case "primary":
                return hovered ? colors.onPrimaryHover : colors.onPrimary;
            case "secondary":
                return colors.text;
            case "outline":
            case "ghost":
                return colors.primary;
            default:
                return hovered ? colors.onPrimaryHover : colors.onPrimary;
        }
    };

    const getBorderColor = () => {
        if (variant === "outline") {
            return isDisabled ? colors.border : colors.primary;
        }
        return "transparent";
    };

    const getPadding = () => {
        switch (size) {
            case "small":
                return { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md };
            case "large":
                return { paddingVertical: Spacing.lg, paddingHorizontal: Spacing.xxl };
            default:
                return { paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl };
        }
    };

    const getFontStyle = () => {
        switch (size) {
            case "small":
                return Typography.buttonSmall;
            default:
                return Typography.button;
        }
    };

    return (
        <Pressable
            onPress={onPress}
            disabled={isDisabled}
            onHoverIn={() => setHovered(true)}
            onHoverOut={() => setHovered(false)}
            style={({ pressed }) => [
                styles.button,
                {
                    backgroundColor: getBackgroundColor(),
                    borderColor: getBorderColor(),
                    opacity: pressed ? 0.8 : 1,
                    ...getPadding(),
                },
                fullWidth && styles.fullWidth,
                style,
            ]}
        >
            {loading ? (
                <ActivityIndicator color={getTextColor()} size="small" />
            ) : (
                <Text
                    style={[
                        styles.text,
                        getFontStyle(),
                        { color: getTextColor() },
                        textStyle,
                    ]}
                >
                    {title}
                </Text>
            )}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    button: {
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
    },
    fullWidth: {
        width: "100%",
    },
    text: {
        textAlign: "center",
    },
});
