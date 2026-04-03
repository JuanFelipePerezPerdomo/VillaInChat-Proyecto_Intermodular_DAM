import { useTheme } from "@/src/hooks";
import { BorderRadius, Spacing } from "@/src/themes";
import { StyleSheet, View, ViewStyle } from "react-native";

interface CardProps {
    children: React.ReactNode;
    style?: ViewStyle;
    variant?: "elevated" | "outlined" | "filled";
    padding?: "none" | "small" | "medium" | "large";
}

export function Card({
    children,
    style,
    variant = "elevated",
    padding = "medium"
}: CardProps){
    const { colors, isDark } = useTheme();

    const getBackgroundColor = () => {
    switch (variant) {
        case "outlined":
            return "transparent";
        case "filled":
            return colors.surfaceVariant;
        default:
            return colors.card;
        }
    };

    const getBorderColor = () => {
        if (variant === "outlined") return colors.border;
        return "transparent";
    };

    const getShadow = () => {
        if (variant !== "elevated") return {};
        return {
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isDark ? 0.3 : 0.1,
            shadowRadius: 4,
            elevation: 3,
        };
    };

    const getPadding = () => {
    switch (padding) {
        case "none":
            return 0;
        case "small":
            return Spacing.sm;
        case "large":
            return Spacing.xl;
        default:
            return Spacing.lg;
        }
    };

   return (
    <View
        style={[
            styles.card,
            {
                backgroundColor: getBackgroundColor(),
                borderColor: getBorderColor(),
                padding: getPadding(),
            },
            getShadow(),
            style,
        ]}
        >
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
});