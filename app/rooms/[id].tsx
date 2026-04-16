import { useTheme } from "@/src/hooks";
import { useUserSheet } from "@/src/providers/UserSheetProvider";
import { getCurrentUser } from "@/src/services/getCurrentUser";
import { supabase } from "@/src/lib/supabase";
import { BorderRadius, Spacing, Typography } from "@/src/themes";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, BackHandler, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Room = {
    chat_id: string,
    name: string,
    FK_group_id: string | null,
}

type UserProfile = {
    user_id: string,
    username: string,
}

type Message = {
    id: number
    content: string
    created_at: string
    FK_author_id: string
    author: {
        username: string
    } | null
}

export default function RoomPage() {
    const { id } = useLocalSearchParams<{ id: string }>()
    const { openUserSheet } = useUserSheet()

    const [room, setRoom] = useState<Room | null>(null)
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState("")
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const { colors, isDark } = useTheme()

    useEffect(() => {
        async function loadData() {
            const [roomData, profileData, messageData] = await Promise.all([
                getRoom(id),
                getUserProfile(),
                getMessage(id),
            ])

            if (roomData == null || profileData == null) {
                router.replace("/home")
                return
            }

            setRoom(roomData)
            setUserProfile(profileData)
            setMessages(messageData)
            setLoading(false)
        }
        loadData()
    }, [])

    // Android hardware back button: if no history, navigate to a safe screen
    useEffect(() => {
        const handler = BackHandler.addEventListener("hardwareBackPress", () => {
            if (router.canGoBack()) {
                router.back()
            } else if (room?.FK_group_id) {
                router.replace({ pathname: "/groups/[id]" as any, params: { id: room.FK_group_id } })
            } else {
                router.replace("/(tabs)/privateChatRooms")
            }
            return true // prevent default behaviour
        })
        return () => handler.remove()
    }, [room])

    useEffect(() => {
        if (!id) return

        const channel = supabase
        .channel(`room:${id}`)
        .on(
            "postgres_changes",
            {
                event: "INSERT",
                schema: "public",
                table: "messages",
                filter: `FK_chat_id=eq.${id}`,
            },
            async (payload) => {
                const { data: author } = await supabase
                .from("user_profile")
                .select("username")
                .eq("user_id", payload.new.FK_author_id)
                .single()

                const newMsg: Message = {
                    id: payload.new.id,
                    created_at: payload.new.created_at,
                    content: payload.new.content,
                    FK_author_id: payload.new.FK_author_id,
                    author: author ?? null,
                }
                setMessages((prev) => [newMsg, ...prev])
            }
        )
        .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [id])

    async function handleSend() {
        if(!newMessage.trim() || !userProfile) return

        setSending(true)
        const { error } = await supabase
        .from("messages")
        .insert({
            content: newMessage.trim(),
            FK_chat_id: id,
            FK_author_id: userProfile.user_id,
            read: false,
        })

        if (!error) setNewMessage("")
        setSending(false)
    }

    if (loading) {
        return (
            <View style={[styles.center, { backgroundColor: colors.background }]}>
                <ActivityIndicator color={colors.primary} />
            </View>
        )
    }

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={["top", "bottom"]}>
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={0}
            >
                <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() =>
                            room?.FK_group_id
                                ? router.replace({ pathname: "/groups/[id]" as any, params: { id: room.FK_group_id } })
                                : router.replace("/(tabs)/privateChatRooms")
                        }
                    >
                        <Ionicons name="arrow-back" size={22} color={colors.primary} />
                    </TouchableOpacity>
                    <Text style={[styles.roomName, { color: colors.text }]}>{room?.name}</Text>
                </View>

                <FlatList
                    style={[styles.flex, { backgroundColor: colors.background }]}
                    data={messages}
                    keyExtractor={(item) => item.id.toString()}
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
                                {showSeparator && (
                                    <DateSeparator date={item.created_at} />
                                )}
                            </>
                        )
                    }}
                    ListEmptyComponent={
                        <View style={styles.emptyMessages}>
                            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>No hay mensajes aun...</Text>
                        </View>
                    }
                />

                <View style={[styles.inputRow, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.surface, color: isDark ? colors.text : "#ffffff" }]}
                        value={newMessage}
                        onChangeText={setNewMessage}
                        placeholder="Escriba un Mensaje"
                        placeholderTextColor={isDark ? colors.placeholder : "#000000"}
                        multiline
                        maxLength={500}
                        onKeyPress={({ nativeEvent }) => {
                            if (nativeEvent.key === "Enter" && !(nativeEvent as any).shiftKey) {
                                handleSend()
                            }
                        }}
                    />
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
        </SafeAreaView>
    )
}

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
    const time = new Date(message.created_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    })
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
                    {isOwn && (
                        <Text style={[styles.messageTime, { color: colors.textTertiary }]}>{time}</Text>
                    )}
                    <Text style={[styles.messageAuthor, { color: isOwn ? colors.primary : colors.text }]}>
                        {username}
                    </Text>
                    {!isOwn && (
                        <Text style={[styles.messageTime, { color: colors.textTertiary }]}>{time}</Text>
                    )}
                </View>
                <Text style={[styles.messageText, { color: colors.text }, isOwn && styles.messageTextOwn]}>
                    {message.content}
                </Text>
            </View>
            {isOwn && avatar}
        </View>
    )
}

async function getRoom(roomId: string): Promise<Room | null> {
    const user = await getCurrentUser()
    if (!user) return null

    const { data, error } = await supabase
    .from("chat_room")
    .select("chat_id, name, FK_group_id, chat_type, chat_members!inner (FK_user_id)")
    .eq("chat_id", roomId)
    .eq("chat_members.FK_user_id", user.id)
    .single()

    if (error || !data) return null

    let displayName = data.name
    if (data.chat_type === "PRIVATE") {
        const { data: other } = await supabase
            .from("chat_members")
            .select("user_profile (username)")
            .eq("FK_chat_id", roomId)
            .neq("FK_user_id", user.id)
            .single()
        displayName = (other?.user_profile as any)?.username ?? "DM"
    }

    return { chat_id: data.chat_id, name: displayName ?? "", FK_group_id: data.FK_group_id ?? null }
}

async function getUserProfile(): Promise<UserProfile | null> {
    const user = await getCurrentUser()
    if (!user) return null

    const { error, data } = await supabase
    .from("user_profile")
    .select("user_id, username")
    .eq("user_id", user.id)
    .single()

    if (error || !data) return null

    return data
}

async function getMessage(roomId: string): Promise<Message[]> {
    const { data, error } = await supabase
    .from("messages")
    .select("id, content, created_at, FK_author_id, author:user_profile (username)")
    .eq("FK_chat_id", roomId)
    .order("created_at", { ascending: false })
    .limit(50)

    if (error || !data) return []

    return data.map(msg => ({
        ...msg,
        author: Array.isArray(msg.author) ? (msg.author[0] ?? null) : msg.author
    })) as Message[]
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    safeArea: { flex: 1 },
    flex: { flex: 1 },
    header: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.md,
        padding: Spacing.lg,
        borderBottomWidth: 1,
    },
    backButton: {
        padding: Spacing.xs,
    },
    roomName: { ...Typography.h3, flex: 1 },
    messagesList: { padding: Spacing.lg, gap: Spacing.sm },
    emptyMessages: { flex: 1, alignItems: "center", marginTop: 40 },
    emptyText: { ...Typography.bodySmall },
    messageRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: Spacing.sm,
        paddingVertical: Spacing.xs,
    },
    messageContent: { flex: 1 },
    messageMeta: {
        flexDirection: "row",
        alignItems: "baseline",
        gap: Spacing.sm,
        marginBottom: 2,
    },
    messageAuthor: { fontSize: 14, fontWeight: "600" },
    messageTime: { fontSize: 11 },
    messageText: { fontSize: 14, lineHeight: 20 },
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
    avatarInitial: {
        fontSize: 13,
        fontWeight: "600",
    },
    messageRowOwn: { justifyContent: "flex-end" },
    messageContentOwn: { alignItems: "flex-end" },
    messageMetaOwn: { justifyContent: "flex-end" },
    messageTextOwn: { textAlign: "right" },
    dateSeparator: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: Spacing.md,
        gap: Spacing.sm,
    },
    dateLine: { flex: 1, height: 1 },
    dateLabel: { fontSize: 11, paddingHorizontal: Spacing.sm },
})
