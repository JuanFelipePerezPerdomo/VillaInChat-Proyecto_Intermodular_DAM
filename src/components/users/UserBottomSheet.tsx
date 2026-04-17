import { createDM, findExistingDM } from "@/src/actions"
import { useTheme } from "@/src/hooks"
import { BorderRadius, Spacing, Typography } from "@/src/themes"
import { Ionicons } from "@expo/vector-icons"
import BottomSheet, {
    BottomSheetBackdrop,
    BottomSheetModal,
    BottomSheetView,
} from "@gorhom/bottom-sheet"
import { router } from "expo-router"
import { forwardRef, useCallback, useMemo, useState } from "react"
import {
    ActivityIndicator,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

export type SheetUser = {
    user_id: string
    username: string
    course?: string
    groupId?: string
    isCurrentUserAdmin?: boolean
    targetUserRoleInGroup?: string
    onRoleToggle?: () => void
}

type UserBottomSheetProps = {
    user: SheetUser | null
    onClose: () => void
}

export const UserBottomSheet = forwardRef<BottomSheet, UserBottomSheetProps>(
    function UserBottomSheet({ user, onClose }, ref) {
        const { colors, isDark } = useTheme()
        const insets = useSafeAreaInsets()
        const [dmModalVisible, setDmModalVisible] = useState(false)
        const [initialMessage, setInitialMessage] = useState("")
        const [sending, setSending] = useState(false)
        const [checking, setChecking] = useState(false)
        const snapPoints = useMemo(
            () => (Platform.OS === "web" ? ["30%"] : ["25%"]),
            []
        )

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

        async function handleOpenDM() {
            if (!user) return
            setChecking(true)
            const existingChatId = await findExistingDM(user.user_id)
            setChecking(false)
            if (existingChatId) {
                onClose()
                router.push({ pathname: "/rooms/[id]", params: { id: existingChatId } })
                return
            }
            setDmModalVisible(true)
        }

        async function handleSendDM() {
            if (!user || !initialMessage.trim()) return
            setSending(true)
            const result = await createDM(user.user_id, initialMessage.trim())
            setSending(false)
            if (result.error) return
            setInitialMessage("")
            setDmModalVisible(false)
            onClose()
            router.push({ pathname: "/rooms/[id]", params: { id: result.chatId! } })
        }

        return (
            <>
                <BottomSheetModal
                    ref={ref as any}
                    snapPoints={snapPoints}
                    enableDynamicSizing={false}
                    bottomInset={insets.bottom}
                    backdropComponent={renderBackdrop}
                    backgroundStyle={{ backgroundColor: colors.card }}
                    handleIndicatorStyle={{ backgroundColor: colors.border }}
                >
                    <BottomSheetView style={[styles.content, { paddingBottom: Spacing.lg + insets.bottom }]}>
                        {user ? (
                            <>
                                <View style={styles.userCard}>
                                    <View style={[styles.avatar, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                                        <Text style={[styles.avatarText, { color: colors.text }]}>
                                            {user.username.slice(0, 2).toUpperCase()}
                                        </Text>
                                    </View>
                                    <View style={styles.userInfo}>
                                        <Text style={[styles.userValue, { color: colors.text }]} numberOfLines={1}>
                                            {user.username}
                                        </Text>

                                        <TouchableOpacity
                                            style={[styles.dmButton, { borderColor: colors.primary }]}
                                            onPress={handleOpenDM}
                                            disabled={checking}
                                            activeOpacity={0.7}
                                        >
                                            {checking ? (
                                                <ActivityIndicator size="small" color={colors.primary} />
                                            ) : (
                                                <Ionicons name="chatbubble-ellipses-outline" size={16} color={colors.primary} />
                                            )}
                                            <Text style={[styles.dmButtonText, { color: colors.primary }]}>Enviar mensaje</Text>
                                        </TouchableOpacity>

                                        {user.isCurrentUserAdmin && user.targetUserRoleInGroup !== "ADMIN" && (
                                            <TouchableOpacity
                                                style={[styles.dmButton, { borderColor: user.targetUserRoleInGroup === "CLASS_REP" ? "#f59e0b" : colors.border, marginTop: 4 }]}
                                                onPress={() => {
                                                    if (user.onRoleToggle) {
                                                        user.onRoleToggle()
                                                        onClose()
                                                    }
                                                }}
                                                activeOpacity={0.7}
                                            >
                                                <Ionicons 
                                                    name={user.targetUserRoleInGroup === "CLASS_REP" ? "star" : "star-outline"} 
                                                    size={16} 
                                                    color={user.targetUserRoleInGroup === "CLASS_REP" ? "#f59e0b" : colors.textSecondary} 
                                                />
                                                <Text style={[styles.dmButtonText, { color: user.targetUserRoleInGroup === "CLASS_REP" ? "#f59e0b" : colors.textSecondary }]}>
                                                    {user.targetUserRoleInGroup === "CLASS_REP" ? "Quitar delegado" : "Asignar delegado"}
                                                </Text>
                                            </TouchableOpacity>
                                        )}

                                        <View style={styles.courseRow}>
                                            <Ionicons name="school-outline" size={16} color={colors.textSecondary} />
                                            <Text style={[styles.courseText, { color: colors.textSecondary }]}>
                                                {user.course?.trim() ? user.course : "Sin curso"}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </>
                        ) : null}
                    </BottomSheetView>
                </BottomSheetModal>

                <Modal
                    visible={dmModalVisible}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setDmModalVisible(false)}
                >
                    <TouchableOpacity
                        style={styles.modalOverlay}
                        activeOpacity={1}
                        onPress={() => setDmModalVisible(false)}
                    >
                        <TouchableOpacity
                            style={[styles.modalBox, {
                                backgroundColor: isDark ? colors.card : "#c2e0e0",
                                borderWidth: isDark ? 0 : 1,
                                borderColor: colors.border,
                            }]}
                            activeOpacity={1}
                        >
                            <Text style={[styles.modalTitle, { color: colors.text }]}>
                                Mensaje a {user?.username}
                            </Text>
                            <TextInput
                                style={[styles.modalInput, {
                                    backgroundColor: isDark ? colors.surface : "#c2e0e0",
                                    color: colors.text,
                                    borderColor: isDark ? colors.border : "#c2e0e0",
                                }]}
                                placeholder="Escribe tu primer mensaje..."
                                placeholderTextColor={colors.placeholder}
                                value={initialMessage}
                                onChangeText={setInitialMessage}
                                multiline
                                maxLength={300}
                                autoFocus
                            />
                            <View style={styles.modalActions}>
                                <TouchableOpacity
                                    style={[styles.modalBtn, { borderColor: colors.border }]}
                                    onPress={() => setDmModalVisible(false)}
                                >
                                    <Text style={[styles.modalBtnText, { color: colors.textSecondary }]}>
                                        Cancelar
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.modalBtn, styles.modalBtnPrimary, {
                                        backgroundColor: initialMessage.trim() ? colors.primary : colors.surfaceVariant,
                                    }]}
                                    onPress={handleSendDM}
                                    disabled={!initialMessage.trim() || sending}
                                >
                                    {sending
                                        ? <ActivityIndicator color="#fff" size="small" />
                                        : <Text style={styles.modalBtnPrimaryText}>Enviar</Text>
                                    }
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </Modal>
            </>
        )
    }
)

const styles = StyleSheet.create({
    content: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.lg,
        paddingTop: Spacing.sm,
    },
    userCard: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.lg,
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: BorderRadius.full,
        borderWidth: 2,
        alignItems: "center",
        justifyContent: "center",
    },
    avatarText: {
        ...Typography.h3,
    },
    userInfo: {
        flex: 1,
        gap: Spacing.sm,
        minWidth: 0,
    },
    userValue: {
        ...Typography.h3,
    },
    dmButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: Spacing.xs,
        marginTop: Spacing.xs,
        borderWidth: 1,
        borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
    },
    dmButtonText: {
        fontSize: 14,
        fontWeight: "600",
    },
    courseRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.xs,
    },
    courseText: {
        ...Typography.body,
    },
    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
        padding: Spacing.xl,
    },
    modalBox: {
        width: "100%",
        maxWidth: 400,
        borderRadius: BorderRadius.lg,
        padding: Spacing.xl,
        gap: Spacing.lg,
    },
    modalTitle: {
        ...Typography.h3,
    },
    modalInput: {
        borderWidth: 1,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        ...Typography.body,
        minHeight: 80,
        textAlignVertical: "top",
    },
    modalActions: {
        flexDirection: "row",
        gap: Spacing.md,
    },
    modalBtn: {
        flex: 1,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    modalBtnText: {
        ...Typography.button,
    },
    modalBtnPrimary: {
        borderWidth: 0,
    },
    modalBtnPrimaryText: {
        ...Typography.button,
        color: "#fff",
    },
})
