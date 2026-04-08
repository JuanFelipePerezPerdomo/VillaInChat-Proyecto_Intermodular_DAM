import { createDM, findExistingDM } from "@/src/actions"
import { useTheme } from "@/src/hooks"
import { BorderRadius, Spacing, Typography } from "@/src/themes"
import BottomSheet, {
    BottomSheetBackdrop,
    BottomSheetModal,
    BottomSheetView,
} from "@gorhom/bottom-sheet"
import { router } from "expo-router"
import { forwardRef, useCallback, useState } from "react"
import {
    ActivityIndicator,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native"

export type SheetUser = {
    user_id: string
    username: string
}

type UserBottomSheetProps = {
    user: SheetUser | null
    onClose: () => void
}

export const UserBottomSheet = forwardRef<BottomSheet, UserBottomSheetProps>(
    function UserBottomSheet({ user, onClose }, ref) {
        const { colors } = useTheme()
        const [dmModalVisible, setDmModalVisible] = useState(false)
        const [initialMessage, setInitialMessage] = useState("")
        const [sending, setSending] = useState(false)
        const [checking, setChecking] = useState(false)

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
                                    onPress={handleOpenDM}
                                    disabled={checking}
                                >
                                    <Text style={[styles.actionText, { color: colors.text }]}>
                                        Enviar Mensaje Directo
                                    </Text>
                                </TouchableOpacity>
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
                            style={[styles.modalBox, { backgroundColor: colors.card }]}
                            activeOpacity={1}
                        >
                            <Text style={[styles.modalTitle, { color: colors.text }]}>
                                Mensaje a {user?.username}
                            </Text>
                            <TextInput
                                style={[styles.modalInput, {
                                    backgroundColor: colors.surface,
                                    color: colors.text,
                                    borderColor: colors.border,
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
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
    },
    actionText: {
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
