import { useGroupMemberSearch } from "@/src/hooks"
import { useTheme } from "@/src/hooks/useTheme"
import { UserSearchResult } from "@/src/services/searchUsers"
import { BorderRadius, Spacing, Typography } from "@/src/themes"
import { Ionicons } from "@expo/vector-icons"
import { useState } from "react"
import {
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native"
import { Tooltip } from "@/src/components/ui"
import { FlatList } from "react-native-gesture-handler"

type Props = {
    members: UserSearchResult[]
    onSelectUser: (user: UserSearchResult) => void
}

export function GroupMemberSearch({ members, onSelectUser }: Props) {
    const { colors } = useTheme()
    const [visible, setVisible] = useState(false)
    const { query, setQuery, results, clearSearch } = useGroupMemberSearch(members)

    function handleSelect(user: UserSearchResult) {
        clearSearch()
        setVisible(false)
        onSelectUser(user)
    }

    function handleClose() {
        clearSearch()
        setVisible(false)
    }

    const displayData = query.trim().length > 0 ? results : members

    const MemberRow = ({ item }: { item: UserSearchResult }) => (
        <TouchableOpacity
            style={[styles.resultRow, { borderBottomColor: colors.divider }]}
            onPress={() => handleSelect(item)}
        >
            <View style={[styles.avatar, { backgroundColor: colors.primary + "22" }]}>
                <Text style={[styles.avatarInitial, { color: colors.primary }]}>
                    {item.username[0].toUpperCase()}
                </Text>
            </View>
            <Text style={[styles.resultName, { color: colors.text }]}>{item.username}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
        </TouchableOpacity>
    )

    const ResultList = () => (
        <>
            <View style={[styles.searchBox, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                <Ionicons name="search" size={16} color={colors.placeholder} />
                <TextInput
                    value={query}
                    onChangeText={setQuery}
                    placeholder="Buscar miembro..."
                    placeholderTextColor={colors.placeholder}
                    style={[styles.searchInput, { color: colors.text }]}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoFocus
                />
                {query.length > 0 && (
                    <TouchableOpacity onPress={clearSearch} hitSlop={8}>
                        <Ionicons name="close" size={16} color={colors.placeholder} />
                    </TouchableOpacity>
                )}
            </View>

            {query.trim().length > 0 && results.length === 0 ? (
                <Text style={[styles.noResults, { color: colors.textTertiary }]}>
                    No se encontraron miembros
                </Text>
            ) : (
                displayData.length > 0 && (
                    <FlatList
                        data={displayData}
                        keyExtractor={(m: UserSearchResult) => m.user_id}
                        style={styles.list}
                        keyboardShouldPersistTaps="handled"
                        renderItem={({ item }: { item: UserSearchResult }) => <MemberRow item={item} />}
                    />
                )
            )}
        </>
    )

    // ── Botón de la lupa que va en el header ──────────────────────────────────
    // El tooltip solo se muestra cuando el panel está cerrado
    const TriggerButton = () => (
        <Tooltip text="Buscar miembros" disabled={visible}>
            <TouchableOpacity
                onPress={() => setVisible(v => !v)}
                hitSlop={8}
                style={styles.trigger}
            >
                <Ionicons name="search" size={22} color={colors.primary} />
            </TouchableOpacity>
        </Tooltip>
    )

    // ── Web: panel desplegable debajo del botón ───────────────────────────────
    if (Platform.OS === "web") {
        return (
            <View style={styles.webWrapper}>
                <TriggerButton />
                {visible && (
                    <>
                        {/* Capa para cerrar al hacer clic fuera */}
                        <TouchableOpacity
                            style={styles.webBackdrop}
                            onPress={handleClose}
                            activeOpacity={1}
                        />
                        <View style={[styles.webPanel, {
                            backgroundColor: colors.card,
                            borderColor: colors.border,
                            shadowColor: colors.text,
                        }]}>
                            <ResultList />
                        </View>
                    </>
                )}
            </View>
        )
    }

    // ── Móvil: modal con overlay difuminado ───────────────────────────────────
    return (
        <>
            <TriggerButton />
            <Modal
                visible={visible}
                transparent
                animationType="fade"
                onRequestClose={handleClose}
            >
                <TouchableOpacity
                    style={styles.mobileOverlay}
                    activeOpacity={1}
                    onPress={handleClose}
                >
                    <TouchableOpacity
                        style={[styles.mobilePanel, { backgroundColor: colors.card }]}
                        activeOpacity={1}
                    >
                        <View style={styles.mobilePanelHeader}>
                            <Text style={[styles.mobilePanelTitle, { color: colors.text }]}>
                                Buscar miembro
                            </Text>
                            <TouchableOpacity onPress={handleClose} hitSlop={8}>
                                <Ionicons name="close" size={22} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                        <ResultList />
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
        </>
    )
}

const styles = StyleSheet.create({
    trigger: {
        padding: 4,
    },
    searchBox: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.xs,
        borderWidth: 1,
        borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
        marginBottom: Spacing.xs,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        paddingVertical: 4,
    },
    list: {
        maxHeight: 260,
    },
    resultRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.sm,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.xs,
        borderBottomWidth: 1,
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
    },
    avatarInitial: {
        fontSize: 14,
        fontWeight: "700",
    },
    resultName: {
        flex: 1,
        fontSize: 14,
    },
    noResults: {
        fontSize: 13,
        textAlign: "center",
        paddingVertical: Spacing.md,
    },
    // Web
    webWrapper: {
        position: "relative",
        zIndex: 200,
        overflow: "visible",
    },
    webBackdrop: {
        position: "fixed" as any,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10,
    },
    webPanel: {
        position: "absolute",
        top: 34,
        right: 0,
        width: 280,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        padding: Spacing.md,
        zIndex: 11,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 8,
    },
    // Móvil
    mobileOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.55)",
        justifyContent: "center",
        padding: Spacing.xl,
    },
    mobilePanel: {
        borderRadius: BorderRadius.xl,
        padding: Spacing.xl,
        gap: Spacing.md,
    },
    mobilePanelHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: Spacing.xs,
    },
    mobilePanelTitle: {
        ...Typography.h3,
        fontWeight: "700",
    },
})
