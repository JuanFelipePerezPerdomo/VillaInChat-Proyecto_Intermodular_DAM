import { useTheme } from "@/src/hooks"
import { useUserSearch } from "@/src/hooks/useUserSearch"
import { UserSearchResult } from "@/src/services/searchUsers"
import { BorderRadius, Spacing, Typography } from "@/src/themes"
import { Ionicons } from "@expo/vector-icons"
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native"
import { FlatList } from "react-native-gesture-handler"

type Props = {
    excludeId: string | null
    selectedUsers: UserSearchResult[]
    onAdd: (user: UserSearchResult) => void
    onRemove: (userId: string) => void
    filterUserIds?: string[]
}

export function UserSearchPicker({ excludeId, selectedUsers, onAdd, onRemove, filterUserIds }: Props) {
    const { colors, isDark } = useTheme()
    const { query, setQuery, results, loading, clearSearch } = useUserSearch(excludeId)

    const filteredResults = results.filter(
        (r) => !selectedUsers.some((s) => s.user_id === r.user_id)
            && !(filterUserIds ?? []).includes(r.user_id)
    )

    function handleAdd(user: UserSearchResult) {
        onAdd(user)
        clearSearch()
    }

    return (
        <View style={styles.container}>
            <Text style={[styles.label, { color: colors.text }]}>Añadir miembros</Text>

            {/* Chips de usuarios seleccionados */}
            {selectedUsers.length > 0 && (
                <View style={styles.chipsRow}>
                    {selectedUsers.map((user) => (
                        <View key={user.user_id} style={[styles.chip, { backgroundColor: colors.primary + "1a", borderColor: colors.primary }]}>
                            <Text style={[styles.chipText, { color: colors.primary }]}>{user.username}</Text>
                            <TouchableOpacity onPress={() => onRemove(user.user_id)} hitSlop={8}>
                                <Ionicons name="close-circle" size={16} color={colors.primary} />
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
            )}

            {/* Input de búsqueda */}
            <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                <Ionicons name="search" size={16} color={colors.placeholder} style={styles.searchIcon} />
                <TextInput
                    value={query}
                    onChangeText={setQuery}
                    placeholder="Buscar por nombre de usuario..."
                    placeholderTextColor={isDark ? colors.placeholder : "#000000"}
                    style={[styles.input, { color: isDark ? colors.text : "#ffffff" }]}
                    autoCapitalize="none"
                    autoCorrect={false}
                />
                {loading && <ActivityIndicator size="small" color={colors.primary} style={styles.searchIcon} />}
                {!loading && query.length > 0 && (
                    <TouchableOpacity onPress={clearSearch} hitSlop={8}>
                        <Ionicons name="close" size={16} color={colors.placeholder} style={styles.searchIcon} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Lista de resultados */}
            {filteredResults.length > 0 && (
                <View style={[styles.resultsList, { borderColor: colors.border, backgroundColor: colors.card }]}>
                    <FlatList
                        data={filteredResults}
                        keyExtractor={(item) => item.user_id}
                        scrollEnabled={filteredResults.length > 4}
                        style={{ maxHeight: 180 }}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[styles.resultItem, { borderBottomColor: colors.divider }]}
                                onPress={() => handleAdd(item)}
                            >
                                <View style={[styles.avatar, { backgroundColor: colors.primary + "22" }]}>
                                    <Text style={[styles.avatarText, { color: colors.primary }]}>
                                        {item.username[0].toUpperCase()}
                                    </Text>
                                </View>
                                <Text style={[styles.resultName, { color: colors.text }]}>{item.username}</Text>
                                <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                            </TouchableOpacity>
                        )}
                    />
                </View>
            )}

            {!loading && query.trim().length > 0 && filteredResults.length === 0 && (
                <Text style={[styles.noResults, { color: colors.textTertiary }]}>
                    No se encontraron usuarios
                </Text>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        gap: Spacing.sm,
        marginTop: Spacing.md,
    },
    label: {
        ...Typography.label,
        marginBottom: Spacing.xs,
    },
    chipsRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: Spacing.xs,
    },
    chip: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingVertical: 4,
        paddingHorizontal: Spacing.sm,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
    },
    chipText: {
        fontSize: 13,
        fontWeight: "500",
    },
    inputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.sm,
    },
    searchIcon: {
        paddingHorizontal: 4,
    },
    input: {
        flex: 1,
        paddingVertical: Spacing.md,
        fontSize: 14,
    },
    resultsList: {
        borderWidth: 1,
        borderRadius: BorderRadius.md,
        overflow: "hidden",
    },
    resultItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.sm,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        borderBottomWidth: 1,
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
    },
    avatarText: {
        fontSize: 14,
        fontWeight: "600",
    },
    resultName: {
        flex: 1,
        fontSize: 14,
    },
    noResults: {
        fontSize: 13,
        textAlign: "center",
        paddingVertical: Spacing.xs,
    },
})
