import { useTheme } from "@/src/hooks"
import { BorderRadius, Spacing, Typography } from "@/src/themes"
import { useRef, useState } from "react"
import {
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native"

type Member = { user_id: string; username: string }

type Props = {
    value: string
    onChangeText: (text: string) => void
    groupMembers: Member[]
    placeholder?: string
    maxLength?: number
    onSubmitEditing?: () => void
}

/**
 * A TextInput that detects `@` triggers and shows a suggestion dropdown
 * of group members (plus `@everyone`). Selecting a suggestion inserts the
 * username into the text at the correct position.
 */
export function MentionInput({
    value,
    onChangeText,
    groupMembers,
    placeholder = "Escriba un mensaje...",
    maxLength = 500,
    onSubmitEditing,
}: Props) {
    const { colors, isDark } = useTheme()
    const inputRef = useRef<TextInput>(null)
    const [cursorPos, setCursorPos] = useState(0)
    const [suggestions, setSuggestions] = useState<Member[]>([])
    const [mentionStart, setMentionStart] = useState<number | null>(null)

    function handleSelectionChange(e: { nativeEvent: { selection: { start: number; end: number } } }) {
        const pos = e.nativeEvent.selection.start
        setCursorPos(pos)
        updateSuggestions(value, pos)
    }

    function handleChangeText(text: string) {
        onChangeText(text)
        updateSuggestions(text, cursorPos)
    }

    /** Looks backwards from the cursor to find an active @mention query. */
    function updateSuggestions(text: string, cursor: number) {
        const before = text.slice(0, cursor)
        // Find last @ before cursor that has no space after it
        const match = before.match(/@(\w*)$/)

        if (match) {
            const query = match[1].toLowerCase()
            const start = before.lastIndexOf("@")
            setMentionStart(start)

            const everyoneOption: Member = { user_id: "__everyone__", username: "everyone" }
            const filtered = [everyoneOption, ...groupMembers].filter(m =>
                m.username.toLowerCase().startsWith(query)
            )
            setSuggestions(filtered)
        } else {
            setMentionStart(null)
            setSuggestions([])
        }
    }

    function handleSelectSuggestion(member: Member) {
        if (mentionStart === null) return

        const before = value.slice(0, mentionStart)      // text before the @
        const after  = value.slice(cursorPos)             // text after the cursor
        const inserted = `@${member.username} `

        const newText = before + inserted + after
        onChangeText(newText)

        // Move cursor to end of inserted mention
        const newCursor = before.length + inserted.length
        setCursorPos(newCursor)
        setSuggestions([])
        setMentionStart(null)

        // Restore focus
        inputRef.current?.focus()
    }

    return (
        <View style={styles.wrapper}>
            {/* Dropdown (above input) */}
            {suggestions.length > 0 && (
                <View style={[styles.dropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <FlatList
                        data={suggestions}
                        keyExtractor={item => item.user_id}
                        keyboardShouldPersistTaps="always"
                        style={styles.dropdownList}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[styles.suggestion, { borderBottomColor: colors.divider }]}
                                onPress={() => handleSelectSuggestion(item)}
                            >
                                <View style={[styles.suggestionAvatar, { backgroundColor: colors.primary + "22" }]}>
                                    <Text style={[styles.suggestionInitial, { color: colors.primary }]}>
                                        {item.username === "everyone" ? "@" : item.username[0].toUpperCase()}
                                    </Text>
                                </View>
                                <Text style={[styles.suggestionName, { color: colors.text }]}>
                                    @{item.username}
                                </Text>
                                {item.username === "everyone" && (
                                    <Text style={[styles.everyoneTag, { color: colors.textTertiary }]}>
                                        Mencionar a todos
                                    </Text>
                                )}
                            </TouchableOpacity>
                        )}
                    />
                </View>
            )}

            {/* Text input */}
            <TextInput
                ref={inputRef}
                style={[
                    styles.input,
                    { backgroundColor: colors.surface, color: isDark ? colors.text : "#ffffff" },
                ]}
                value={value}
                onChangeText={handleChangeText}
                onSelectionChange={handleSelectionChange}
                placeholder={placeholder}
                placeholderTextColor={isDark ? colors.placeholder : "#000000"}
                multiline
                maxLength={maxLength}
                onSubmitEditing={onSubmitEditing}
                onKeyPress={({ nativeEvent }) => {
                    if (nativeEvent.key === "Enter" && !(nativeEvent as any).shiftKey) {
                        (nativeEvent as any).preventDefault?.()
                        onSubmitEditing?.()
                    }
                }}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    wrapper: { flex: 1, position: "relative" },
    input: {
        borderRadius: BorderRadius.full,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
        ...Typography.bodySmall,
        maxHeight: 100,
    },
    dropdown: {
        position: "absolute",
        bottom: "100%",
        left: 0,
        right: 0,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        marginBottom: 4,
        maxHeight: 180,
        zIndex: 999,
        elevation: 8,
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowRadius: 8,
    },
    dropdownList: { padding: Spacing.xs },
    suggestion: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.sm,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.xs,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    suggestionAvatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
    },
    suggestionInitial:  { fontSize: 12, fontWeight: "700" },
    suggestionName:     { fontSize: 14, fontWeight: "600", flex: 1 },
    everyoneTag:        { fontSize: 12 },
})
