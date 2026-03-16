import { supabase } from "@/src/lib/supabase"
import { getCurrentUser } from "@/src/services/getCurrentUser"
import { Ionicons } from "@expo/vector-icons"
import { router, useLocalSearchParams } from "expo-router"
import { useEffect, useState } from "react"
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { FlatList } from "react-native-gesture-handler"
import { SafeAreaView } from "react-native-safe-area-context"

type ChatType = "PRIVATE" | "PUBLIC" | "ANNOUNCEMENTS"

type GroupChat = {
    chat_id: string
    name: string
    chat_type: ChatType
}

type GroupInfo = {
    group_id: string
    group_name: string
}

const CHAT_TYPE_CONFIG: Record<ChatType, { icon: keyof typeof Ionicons.glyphMap; label: string; color: string }> = {
    PUBLIC:        { icon: "chatbubbles-outline",    label: "General",  color: "#6366f1" },
    PRIVATE:       { icon: "lock-closed-outline",    label: "Privado",  color: "#6b7280" },
    ANNOUNCEMENTS: { icon: "megaphone-outline",      label: "Avisos",   color: "#f59e0b" },
}

export default function GroupPage() {
    const { id } = useLocalSearchParams<{ id: string }>()

    const [group, setGroup] = useState<GroupInfo | null>(null)
    const [chats, setChats] = useState<GroupChat[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadData() {
            const user = await getCurrentUser()
            if (!user) {
                router.replace("/SignIn")
                return
            }

            const [groupData, chatsData] = await Promise.all([
                getGroupInfo(id, user.id),
                getGroupChats(id),
            ])

            if (!groupData) {
                router.replace("/home")
                return
            }

            setGroup(groupData)
            setChats(chatsData)
            setLoading(false)
        }
        loadData()
    }, [id])

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator />
            </View>
        )
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color="#6366f1" />
                </TouchableOpacity>
                <Text style={styles.groupName}>{group?.group_name}</Text>
            </View>

            <FlatList
                data={chats}
                keyExtractor={(item) => item.chat_id}
                contentContainerStyle={styles.list}
                renderItem={({ item }) => (
                    <ChatCard
                        chat={item}
                        onPress={() => router.push({ pathname: "/rooms/[id]", params: { id: item.chat_id } })}
                    />
                )}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Ionicons name="chatbubble-outline" size={40} color="#d1d5db" />
                        <Text style={styles.emptyText}>No hay chats en este grupo</Text>
                    </View>
                }
            />
        </SafeAreaView>
    )
}

function ChatCard({ chat, onPress }: { chat: GroupChat; onPress: () => void }) {
    const config = CHAT_TYPE_CONFIG[chat.chat_type]

    return (
        <TouchableOpacity style={styles.card} onPress={onPress}>
            <View style={[styles.iconContainer, { backgroundColor: config.color + "1a" }]}>
                <Ionicons name={config.icon} size={24} color={config.color} />
            </View>
            <View style={styles.cardContent}>
                <Text style={styles.chatName}>{chat.name}</Text>
                <Text style={styles.chatType}>{config.label}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
        </TouchableOpacity>
    )
}

async function getGroupInfo(groupId: string, userId: string): Promise<GroupInfo | null> {
    const { data, error } = await supabase
        .from("group_room")
        .select("group_id, group_name, group_members!inner (FK_user_id)")
        .eq("group_id", groupId)
        .eq("group_members.FK_user_id", userId)
        .single()

    if (error || !data) return null
    return { group_id: data.group_id, group_name: data.group_name }
}

async function getGroupChats(groupId: string): Promise<GroupChat[]> {
    const { data, error } = await supabase
        .from("chat_room")
        .select("chat_id, name, chat_type")
        .eq("FK_group_id", groupId)
        .order("chat_type", { ascending: true })

    if (error || !data) return []
    return data as GroupChat[]
}

const styles = StyleSheet.create({
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    container: {
        flex: 1,
        backgroundColor: "#f9fafb",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        padding: 16,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#e5e7eb",
    },
    backBtn: {
        padding: 4,
    },
    groupName: {
        fontSize: 18,
        fontWeight: "600",
        flex: 1,
    },
    list: {
        padding: 16,
        gap: 10,
    },
    card: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 14,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: "center",
        alignItems: "center",
    },
    cardContent: {
        flex: 1,
        gap: 2,
    },
    chatName: {
        fontSize: 15,
        fontWeight: "600",
        color: "#111827",
    },
    chatType: {
        fontSize: 12,
        color: "#6b7280",
    },
    empty: {
        alignItems: "center",
        marginTop: 60,
        gap: 12,
    },
    emptyText: {
        color: "#9ca3af",
        fontSize: 14,
    },
})
