import { useTheme } from "@/src/hooks"
import { useUserSheet } from "@/src/providers/UserSheetProvider"
import { getCurrentUser } from "@/src/services/getCurrentUser"
import { insertMentions, parseMentions } from "@/src/services/mentionServices"
import { supabase } from "@/src/lib/supabase"
import { BorderRadius, Spacing, Typography } from "@/src/themes"
import { Ionicons } from "@expo/vector-icons"
import { useEffect, useState } from "react"
import {
    ActivityIndicator, FlatList, KeyboardAvoidingView,
    Platform, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from "react-native"
import { MentionInput } from "./MentionInput"

type Message = {
    id: number
    content: string
    created_at: string
    FK_author_id: string
    author: { username: string } | null
}

type UserProfile = { user_id: string; username: string }

type GroupMember = { user_id: string; username: string }

type Props = {
    chatId: string
    chatName: string
    onBack: () => void
    groupMembers?: GroupMember[]
}

export function ChatPanel({ chatId, chatName, onBack, groupMembers }: Props) {
    const { colors, isDark } = useTheme()
    const { openUserSheet } = useUserSheet()

    const [messages, setMessages]       = useState<Message[]>([])
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
    const [newMessage, setNewMessage]   = useState("")
    const [loading, setLoading]         = useState(true)
    const [sending, setSending]         = useState(false)

    // Reload messages whenever the chat changes
    useEffect(() => {
        let cancelled = false
        setLoading(true)
        setMessages([])

        async function load() {
            const user = await getCurrentUser()
            if (!user || cancelled) return
            const [profile, msgs] = await Promise.all([
                getUserProfile(user.id),
                getMessages(chatId),
            ])
            if (!cancelled) {
                setUserProfile(profile)
                setMessages(msgs)
                setLoading(false)
            }
        }
        load()
        return () => { cancelled = true }
    }, [chatId])

    // Real-time subscription per chat
    useEffect(() => {
        const channel = supabase
            .channel(`chat_panel:${chatId}`)
            .on("postgres_changes", {
                event: "INSERT",
                schema: "public",
                table: "messages",
                filter: `FK_chat_id=eq.${chatId}`,
            }, async (payload) => {
                const { data: authorData } = await supabase
                    .from("user_profile")
                    .select("username")
                    .eq("user_id", payload.new.FK_author_id)
                    .single()
                setMessages(prev => [{
                    id: payload.new.id,
                    created_at: payload.new.created_at,
                    content: payload.new.content,
                    FK_author_id: payload.new.FK_author_id,
                    author: authorData ?? null,
                }, ...prev])
            })
            .subscribe()
        return () => { supabase.removeChannel(channel) }
    }, [chatId])

    async function handleSend() {
        if (!newMessage.trim() || !userProfile) return
        setSending(true)
        const content = newMessage.trim()

        const { data: inserted, error } = await supabase
            .from("messages")
            .insert({
                content,
                FK_chat_id: chatId,
                FK_author_id: userProfile.user_id,
                read: false,
            })
            .select("id")
            .single()

        if (!error && inserted) {
            setNewMessage("")
            // Parse and insert mentions (only for group chats)
            // groupMembers can be [] — @everyone doesn't require members in the list
            if (groupMembers !== undefined) {
                const mentions = parseMentions(content, groupMembers)
                console.log("[mentions] parsed from content:", mentions)
                if (mentions.length > 0) {
                    await insertMentions(inserted.id, chatId, userProfile.user_id, mentions)
                }
            }
        }
        setSending(false)
    }

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={8}>
                    <Ionicons name="arrow-back" size={22} color={colors.primary} />
                </TouchableOpacity>
                <Text style={[styles.chatName, { color: colors.text }]} numberOfLines={1}>
                    {chatName}
                </Text>
            </View>

            {/* Messages */}
            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    style={{ flex: 1, backgroundColor: colors.background }}
                    data={messages}
                    keyExtractor={item => item.id.toString()}
                    inverted
                    contentContainerStyle={styles.messagesList}
                    renderItem={({ item, index }) => {
                        const isOwn = item.FK_author_id === userProfile?.user_id
                        const currentDate = new Date(item.created_at).toDateString()
                        const nextMsg = messages[index + 1]
                        const nextDate = nextMsg ? new Date(nextMsg.created_at).toDateString() : null
                        const showSeparator = nextDate !== null && currentDate !== nextDate
                        return (
                            <>
                                <MessageBubble
                                    message={item}
                                    isOwn={isOwn}
                                    onAvatarPress={() => openUserSheet({
                                        user_id: item.FK_author_id,
                                        username: item.author?.username ?? "Desconocido",
                                    })}
                                />
                                {showSeparator && <DateSeparator date={item.created_at} />}
                            </>
                        )
                    }}
                    ListEmptyComponent={
                        <View style={styles.emptyMessages}>
                            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
                                No hay mensajes aún...
                            </Text>
                        </View>
                    }
                />
            )}

            {/* Input */}
            <View style={[styles.inputRow, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
                {groupMembers ? (
                    <MentionInput
                        value={newMessage}
                        onChangeText={setNewMessage}
                        groupMembers={groupMembers}
                        onSubmitEditing={handleSend}
                    />
                ) : (
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.surface, color: isDark ? colors.text : "#ffffff" }]}
                        value={newMessage}
                        onChangeText={setNewMessage}
                        placeholder="Escriba un mensaje..."
                        placeholderTextColor={isDark ? colors.placeholder : "#000000"}
                        multiline
                        maxLength={500}
                        onKeyPress={({ nativeEvent }) => {
                            if (nativeEvent.key === "Enter" && !(nativeEvent as any).shiftKey) {
                                handleSend()
                            }
                        }}
                    />
                )}
                <TouchableOpacity
                    style={[
                        styles.sendBtn,
                        { backgroundColor: colors.primary },
                        (!newMessage.trim() || sending) && { backgroundColor: colors.surfaceVariant },
                    ]}
                    onPress={handleSend}
                    disabled={!newMessage.trim() || sending}
                >
                    <Ionicons
                        name="send"
                        size={18}
                        color={(!newMessage.trim() || sending) ? colors.textTertiary : "#fff"}
                    />
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    )
}

// ─── Queries ─────────────────────────────────────────────────────────────────

async function getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
        .from("user_profile")
        .select("user_id, username")
        .eq("user_id", userId)
        .single()
    if (error || !data) return null
    return data
}

async function getMessages(chatId: string): Promise<Message[]> {
    const { data, error } = await supabase
        .from("messages")
        .select("id, content, created_at, FK_author_id, author:user_profile (username)")
        .eq("FK_chat_id", chatId)
        .order("created_at", { ascending: false })
        .limit(50)
    if (error || !data) return []
    return data.map(msg => ({
        ...msg,
        author: Array.isArray(msg.author) ? (msg.author[0] ?? null) : msg.author,
    })) as Message[]
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function DateSeparator({ date }: { date: string }) {
    const { colors } = useTheme()
    const label = new Date(date).toLocaleDateString([], { day: "2-digit", month: "2-digit", year: "numeric" })
    return (
        <View style={styles.dateSeparator}>
            <View style={[styles.dateLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dateLabel, { color: colors.textTertiary, backgroundColor: colors.background }]}>
                {label}
            </Text>
            <View style={[styles.dateLine, { backgroundColor: colors.border }]} />
        </View>
    )
}

function MessageBubble({ message, isOwn, onAvatarPress }: {
    message: Message
    isOwn: boolean
    onAvatarPress: () => void
}) {
    const { colors } = useTheme()
    const time = new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    const username = message.author?.username ?? "Desconocido"
    const initial = username.charAt(0).toUpperCase()

    const avatar = (
        <TouchableOpacity
            style={[styles.avatarCircle, { backgroundColor: colors.surfaceVariant }]}
            onPress={onAvatarPress}
        >
            <Text style={[styles.avatarInitial, { color: colors.text }]}>{initial}</Text>
        </TouchableOpacity>
    )

    return (
        <View style={[styles.messageRow, isOwn && styles.messageRowOwn]}>
            {!isOwn && avatar}
            <View style={[styles.messageContent, isOwn && styles.messageContentOwn]}>
                <View style={[styles.messageMeta, isOwn && styles.messageMetaOwn]}>
                    {isOwn && <Text style={[styles.messageTime, { color: colors.textTertiary }]}>{time}</Text>}
                    <Text style={[styles.messageAuthor, { color: isOwn ? colors.primary : colors.text }]}>
                        {username}
                    </Text>
                    {!isOwn && <Text style={[styles.messageTime, { color: colors.textTertiary }]}>{time}</Text>}
                </View>
                <Text style={[styles.messageText, { color: colors.text }, isOwn && styles.messageTextOwn]}>
                    {message.content}
                </Text>
            </View>
            {isOwn && avatar}
        </View>
    )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    header: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.md,
        padding: Spacing.lg,
        borderBottomWidth: 1,
    },
    backBtn:      { padding: Spacing.xs },
    chatName:     { ...Typography.h3, flex: 1 },
    messagesList: { padding: Spacing.lg, gap: Spacing.sm },
    emptyMessages:{ flex: 1, alignItems: "center", marginTop: 40 },
    emptyText:    { ...Typography.bodySmall },
    inputRow: {
        flexDirection: "row",
        padding: Spacing.md,
        gap: Spacing.sm,
        borderTopWidth: 1,
    },
    input: {
        flex: 1,
        borderRadius: BorderRadius.full,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
        ...Typography.bodySmall,
        maxHeight: 100,
    },
    sendBtn: {
        borderRadius: BorderRadius.full,
        width: 40,
        height: 40,
        alignItems: "center",
        justifyContent: "center",
    },
    avatarCircle: {
        width: 32,
        height: 32,
        borderRadius: BorderRadius.full,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 14,
    },
    avatarInitial: { fontSize: 13, fontWeight: "600" },
    messageRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: Spacing.sm,
        paddingVertical: Spacing.xs,
    },
    messageContent:     { flex: 1 },
    messageMeta: {
        flexDirection: "row",
        alignItems: "baseline",
        gap: Spacing.sm,
        marginBottom: 2,
    },
    messageAuthor:      { fontSize: 14, fontWeight: "600" },
    messageTime:        { fontSize: 11 },
    messageText:        { fontSize: 14, lineHeight: 20 },
    messageRowOwn:      { justifyContent: "flex-end" },
    messageContentOwn:  { alignItems: "flex-end" },
    messageMetaOwn:     { justifyContent: "flex-end" },
    messageTextOwn:     { textAlign: "right" },
    dateSeparator: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: Spacing.md,
        gap: Spacing.sm,
    },
    dateLine:  { flex: 1, height: 1 },
    dateLabel: { fontSize: 11, paddingHorizontal: Spacing.sm },
})
