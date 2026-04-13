import { useTheme } from "@/src/hooks/useTheme"
import { BorderRadius, Spacing, Typography } from "@/src/themes"
import { useState } from "react"
import { Platform, StyleSheet, Text, View, ViewStyle } from "react-native"

type Props = {
    text: string
    children: React.ReactNode
    disabled?: boolean
    style?: ViewStyle
}

export function Tooltip({ text, children, disabled = false, style }: Props) {
    const { colors } = useTheme()
    const [visible, setVisible] = useState(false)

    if (Platform.OS !== "web" || disabled) return <>{children}</>

    return (
        <View
            style={[styles.wrapper, style]}
            onPointerEnter={() => setVisible(true)}
            onPointerLeave={() => setVisible(false)}
        >
            {children}
            {visible && (
                <View style={[styles.tooltip, {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                }]}>
                    <Text style={[styles.tooltipText, { color: colors.text }]}>{text}</Text>
                </View>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    wrapper: {
        position: "relative",
        alignItems: "center",
        zIndex: 999,
        overflow: "visible",
    },
    tooltip: {
        position: "absolute",
        bottom: -50,
        right: 0,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        zIndex: 999,
        minWidth: 140,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 8,
    } as any,
    tooltipText: {
        ...Typography.body,
        fontSize: 13,
        fontWeight: "500",
    },
})
