import { useTheme } from "@/src/hooks"
import { BorderRadius, Spacing, Typography } from "@/src/themes"
import BottomSheet, {
    BottomSheetBackdrop,
    BottomSheetModal,
    BottomSheetView,
} from "@gorhom/bottom-sheet"
import { forwardRef, useCallback } from "react"
import { StyleSheet, Text, TouchableOpacity, View } from "react-native"

export type SheetUser = {
    user_id: string
    username: string
}

type UserBottomSheetProps = {
    user: SheetUser | null
}

export const UserBottomSheet = forwardRef<BottomSheet, UserBottomSheetProps>(
    function UserBottomSheet({ user }, ref) {
        const { colors } = useTheme()

        const renderBackdrop = useCallback(
            (props: any) => (
                <BottomSheetBackdrop
                    {...props}
                    disappearsOnIndex={-1}
                    appearsOnIndex={0}
                    opacity={0.5}
                />
            ),
            []
        )

        return (
            <BottomSheetModal
                ref={ref as any}
                enableDynamicSizing
                backdropComponent={renderBackdrop}
                backgroundStyle={{ backgroundColor: colors.card }}
                handleIndicatorStyle={{ backgroundColor: colors.border }}
            >
                <BottomSheetView style={styles.content}>
                    {user ? (
                        <>
                            <View style={styles.userHeader}>
                                <View style={[styles.avatar, { backgroundColor: colors.surfaceVariant }]}>
                                    <Text style={[styles.avatarText, { color: colors.textSecondary }]}>
                                        {user.username.charAt(0).toUpperCase()}
                                    </Text>
                                </View>
                                <Text style={[styles.username, { color: colors.text }]}>
                                    {user.username}
                                </Text>
                            </View>

                            <View style={[styles.divider, { backgroundColor: colors.border }]} />

                            <TouchableOpacity
                                style={[styles.action, { borderColor: colors.border }]}
                                disabled // TODO: implementar DMs
                            >
                                <Text style={[styles.actionText, { color: colors.textSecondary }]}>
                                    Enviar Mensaje Directo
                                </Text>
                                <Text style={[styles.actionBadge, { color: colors.textTertiary }]}>
                                    Próximamente
                                </Text>
                            </TouchableOpacity>
                        </>
                    ) : null}
                </BottomSheetView>
            </BottomSheetModal>
        )
    }
)

const styles = StyleSheet.create({
    content: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.xxl,
        gap: Spacing.lg,
    },
    userHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.md,
        paddingTop: Spacing.sm,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: BorderRadius.full,
        alignItems: "center",
        justifyContent: "center",
    },
    avatarText: {
        ...Typography.h3,
    },
    username: {
        ...Typography.h3,
    },
    divider: {
        height: 1,
    },
    action: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        opacity: 0.5,
    },
    actionText: {
        ...Typography.body,
    },
    actionBadge: {
        ...Typography.caption,
    },
})
