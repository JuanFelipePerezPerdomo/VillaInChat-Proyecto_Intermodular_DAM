import { useTheme } from "@/src/hooks";
import { supabase } from "@/src/lib/supabase";
import { getCurrentUser } from "@/src/services/getCurrentUser";
import { BorderRadius, Spacing, Typography } from "@/src/themes";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
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

    const [room, setRoom] = useState<Room | null>(null)
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState("")
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const { colors } = useTheme()

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
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={["top"]}>
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
                    renderItem={({ item }) => (
                        <MessageBubble
                            message={item}
                            isOwn={item.FK_author_id === userProfile?.user_id}
                        />
                    )}
                    ListEmptyComponent={
                        <View style={styles.emptyMessages}>
                            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>No hay mensajes aun...</Text>
                        </View>
                    }
                />

                <View style={[styles.inputRow, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
                        value={newMessage}
                        onChangeText={setNewMessage}
                        placeholder="Escriba un Mensaje"
                        placeholderTextColor={colors.placeholder}
                        multiline
                        maxLength={500}
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

function MessageBubble({ message, isOwn }: { message: Message, isOwn: boolean }) {
    const { colors } = useTheme()
    const time = new Date(message.created_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    })

    return (
        <View style={[styles.bubbleWrapper, isOwn ? styles.bubbleRight : styles.bubbleLeft]}>
            {!isOwn && (
                <Text style={[styles.bubbleAuthor, { color: colors.textSecondary }]}>
                    {message.author?.username ?? "Desconocido"}
                </Text>
            )}
            <View style={[
                styles.bubble,
                isOwn
                    ? { backgroundColor: colors.primary, borderBottomRightRadius: 4 }
                    : { backgroundColor: colors.card, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: colors.border }
            ]}>
                <Text style={[styles.bubbleText, { color: isOwn ? "#fff" : colors.text }]}>
                    {message.content}
                </Text>
            </View>
            <Text style={[styles.bubbleTime, { color: colors.textTertiary }, isOwn && { textAlign: "right" }]}>
                {time}
            </Text>
        </View>
    )
}

async function getRoom(roomId: string): Promise<Room | null> {
    const user = await getCurrentUser()
    if (!user) return null

    const { data, error } = await supabase
    .from("chat_room")
    .select("chat_id, name, FK_group_id, chat_members!inner (FK_user_id)")
    .eq("chat_id", roomId)
    .eq("chat_members.FK_user_id", user.id)
    .single()

    if (error || !data) return null
    return { chat_id: data.chat_id, name: data.name, FK_group_id: data.FK_group_id ?? null }
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
    bubbleWrapper: { marginBottom: 10, maxWidth: "75%" },
    bubbleLeft: { alignSelf: "flex-start" },
    bubbleRight: { alignSelf: "flex-end" },
    bubbleAuthor: { ...Typography.caption, marginBottom: 2, marginLeft: 4 },
    bubble: { borderRadius: 16, paddingVertical: 8, paddingHorizontal: 12 },
    bubbleText: { fontSize: 14 },
    bubbleTime: { fontSize: 10, marginTop: 2, marginHorizontal: 4 },
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
})
