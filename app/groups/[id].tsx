import { addChatMember, createGroupChat } from "@/src/actions"
import { Button, Input } from "@/src/components/ui"
import { useTheme } from "@/src/hooks"
import { supabase } from "@/src/lib/supabase"
import { getCurrentUser } from "@/src/services/getCurrentUser"
import { UserSearchResult } from "@/src/services/searchUsers"
import { BorderRadius, Spacing, Typography } from "@/src/themes"
import { Ionicons } from "@expo/vector-icons"
import { router, useLocalSearchParams } from "expo-router"
import { useEffect, useState } from "react"
import {
    ActivityIndicator, FlatList, Modal, StyleSheet,
    Text, TouchableOpacity, View
} from "react-native"
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
    userRole: string
}

const CHAT_TYPE_CONFIG: Record<ChatType, { icon: keyof typeof Ionicons.glyphMap; label: string; color: string }> = {
    PUBLIC:        { icon: "chatbubbles-outline",  label: "General",  color: "#6366f1" },
    PRIVATE:       { icon: "lock-closed-outline",  label: "Privado",  color: "#6b7280" },
    ANNOUNCEMENTS: { icon: "megaphone-outline",    label: "Avisos",   color: "#f59e0b" },
}

const CHAT_TYPES: ChatType[] = ["PUBLIC", "PRIVATE", "ANNOUNCEMENTS"]

export default function GroupPage() {
    const { id } = useLocalSearchParams<{ id: string }>()
    const { colors } = useTheme()

    const [group, setGroup]                   = useState<GroupInfo | null>(null)
    const [chats, setChats]                   = useState<GroupChat[]>([])
    const [loading, setLoading]               = useState(true)
    const [isAdmin, setIsAdmin]               = useState(false)
    const [currentUserId, setCurrentUserId]   = useState<string | null>(null)

    // Modal: crear chat
    const [createVisible, setCreateVisible]   = useState(false)
    const [newChatName, setNewChatName]       = useState("")
    const [newChatType, setNewChatType]       = useState<ChatType>("PUBLIC")
    const [creating, setCreating]             = useState(false)

    // Modal: añadir miembros a chat privado
    const [memberChatId, setMemberChatId]         = useState<string | null>(null)
    const [eligibleMembers, setEligibleMembers]   = useState<UserSearchResult[]>([])
    const [memberSearch, setMemberSearch]         = useState("")
    const [addingId, setAddingId]                 = useState<string | null>(null)
    const [loadingMembers, setLoadingMembers]     = useState(false)

    useEffect(() => { loadData() }, [id])

    async function loadData() {
        const user = await getCurrentUser()
        if (!user) { router.replace("/SignIn"); return }
        setCurrentUserId(user.id)

        const [groupData, chatsData] = await Promise.all([
            getGroupInfo(id, user.id),
            getGroupChats(id, user.id),
        ])

        if (!groupData) { router.replace("/home"); return }

        setGroup(groupData)
        setIsAdmin(groupData.userRole === "ADMIN")
        setChats(chatsData)
        setLoading(false)
    }

    async function reloadChats() {
        if (!currentUserId) return
        setChats(await getGroupChats(id, currentUserId))
    }

    async function handleCreateChat() {
        if (!newChatName.trim()) return
        setCreating(true)
        const result = await createGroupChat(id, newChatName.trim(), newChatType)
        setCreating(false)
        if (result.error) return

        setCreateVisible(false)
        setNewChatName("")
        setNewChatType("PUBLIC")
        await reloadChats()

        if (newChatType === "PRIVATE" && result.chatId) {
            openMemberSearch(result.chatId)
        }
    }

    async function openMemberSearch(chatId: string) {
        setMemberChatId(chatId)
        setLoadingMembers(true)
        setEligibleMembers(await getEligibleMembers(id, chatId))
        setLoadingMembers(false)
    }

    async function handleAddMember(member: UserSearchResult) {
        if (!memberChatId) return
        setAddingId(member.user_id)
        await addChatMember(memberChatId, member.user_id)
        setEligibleMembers(prev => prev.filter(m => m.user_id !== member.user_id))
        setAddingId(null)
    }

    function closeMemberModal() {
        setMemberChatId(null)
        setEligibleMembers([])
        setMemberSearch("")
    }

    function closeCreateModal() {
        setCreateVisible(false)
        setNewChatName("")
        setNewChatType("PUBLIC")
    }

    if (loading) {
        return (
            <View style={[styles.center, { backgroundColor: colors.background }]}>
                <ActivityIndicator color={colors.primary} />
            </View>
        )
    }

    const filteredMembers = eligibleMembers.filter(m =>
        m.username.toLowerCase().includes(memberSearch.toLowerCase())
    )

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color={colors.primary} />
                </TouchableOpacity>
                <Text style={[styles.groupName, { color: colors.text }]}>{group?.group_name}</Text>
            </View>

            <FlatList
                data={chats}
                keyExtractor={(item) => item.chat_id}
                contentContainerStyle={styles.list}
                renderItem={({ item }) => (
                    <ChatCard
                        chat={item}
                        isAdmin={isAdmin}
                        onPress={() => router.replace({ pathname: "/rooms/[id]" as any, params: { id: item.chat_id } })}
                        onManageMembers={() => openMemberSearch(item.chat_id)}
                    />
                )}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Ionicons name="chatbubble-outline" size={40} color={colors.border} />
                        <Text style={[styles.emptyText, { color: colors.textTertiary }]}>No hay chats en este grupo</Text>
                    </View>
                }
                ListFooterComponent={isAdmin ? (
                    <TouchableOpacity
                        style={[styles.createCard, { borderColor: colors.primary, backgroundColor: colors.primary + "0d" }]}
                        onPress={() => setCreateVisible(true)}
                    >
                        <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
                        <Text style={[styles.createCardText, { color: colors.primary }]}>Crear nuevo chat</Text>
                    </TouchableOpacity>
                ) : null}
            />

            {/* Modal: crear chat */}
            <Modal visible={createVisible} transparent animationType="fade" onRequestClose={closeCreateModal}>
                <View style={styles.overlay}>
                    <View style={[styles.modal, { backgroundColor: colors.card }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Nuevo chat</Text>

                        <Input
                            label="Nombre del chat"
                            value={newChatName}
                            onChangeText={setNewChatName}
                            placeholder="Ej: Debates, Recursos..."
                            autoFocus
                        />

                        <Text style={[styles.typeLabel, { color: colors.textSecondary }]}>Tipo de chat</Text>
                        {CHAT_TYPES.map(type => {
                            const cfg = CHAT_TYPE_CONFIG[type]
                            const selected = newChatType === type
                            return (
                                <TouchableOpacity
                                    key={type}
                                    style={[styles.typeOption, {
                                        borderColor: selected ? cfg.color : colors.border,
                                        backgroundColor: selected ? cfg.color + "15" : colors.surface,
                                    }]}
                                    onPress={() => setNewChatType(type)}
                                >
                                    <Ionicons name={cfg.icon} size={20} color={selected ? cfg.color : colors.textSecondary} />
                                    <Text style={[styles.typeName, { color: selected ? cfg.color : colors.text }]}>{cfg.label}</Text>
                                    {selected && <Ionicons name="checkmark-circle" size={18} color={cfg.color} style={{ marginLeft: "auto" }} />}
                                </TouchableOpacity>
                            )
                        })}

                        <View style={styles.modalActions}>
                            <Button title="Cancelar" variant="outline" onPress={closeCreateModal} style={{ flex: 1 }} />
                            <Button
                                title="Crear"
                                onPress={handleCreateChat}
                                loading={creating}
                                disabled={!newChatName.trim()}
                                style={{ flex: 1 }}
                            />
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Modal: añadir miembros a chat privado */}
            <Modal visible={memberChatId !== null} transparent animationType="fade" onRequestClose={closeMemberModal}>
                <View style={styles.overlay}>
                    <View style={[styles.modal, { backgroundColor: colors.card }]}>
                        <View style={styles.memberHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>Añadir miembros</Text>
                            <TouchableOpacity onPress={closeMemberModal} hitSlop={8}>
                                <Ionicons name="close" size={22} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        {loadingMembers ? (
                            <ActivityIndicator color={colors.primary} style={{ marginVertical: Spacing.lg }} />
                        ) : (
                            <>
                                <Input
                                    value={memberSearch}
                                    onChangeText={setMemberSearch}
                                    placeholder="Buscar miembro del grupo..."
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />

                                {filteredMembers.length === 0 ? (
                                    <Text style={[styles.noMembers, { color: colors.textTertiary }]}>
                                        {eligibleMembers.length === 0
                                            ? "Todos los miembros ya están en este chat"
                                            : "No se encontraron miembros"}
                                    </Text>
                                ) : (
                                    <FlatList
                                        data={filteredMembers}
                                        keyExtractor={m => m.user_id}
                                        style={styles.memberList}
                                        renderItem={({ item }) => (
                                            <View style={[styles.memberRow, { borderBottomColor: colors.divider }]}>
                                                <View style={[styles.memberAvatar, { backgroundColor: colors.primary + "22" }]}>
                                                    <Text style={[styles.memberInitial, { color: colors.primary }]}>
                                                        {item.username[0].toUpperCase()}
                                                    </Text>
                                                </View>
                                                <Text style={[styles.memberName, { color: colors.text }]}>{item.username}</Text>
                                                <TouchableOpacity
                                                    onPress={() => handleAddMember(item)}
                                                    disabled={addingId === item.user_id}
                                                    hitSlop={8}
                                                >
                                                    {addingId === item.user_id
                                                        ? <ActivityIndicator size="small" color={colors.primary} />
                                                        : <Ionicons name="person-add-outline" size={20} color={colors.primary} />
                                                    }
                                                </TouchableOpacity>
                                            </View>
                                        )}
                                    />
                                )}
                            </>
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    )
}

function ChatCard({
    chat,
    isAdmin,
    onPress,
    onManageMembers,
}: {
    chat: GroupChat
    isAdmin: boolean
    onPress: () => void
    onManageMembers: () => void
}) {
    const cfg = CHAT_TYPE_CONFIG[chat.chat_type]
    const { colors, isDark } = useTheme()

    return (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, shadowOpacity: isDark ? 0.3 : 0.05 }]}
            onPress={onPress}
        >
            <View style={[styles.iconContainer, { backgroundColor: cfg.color + "1a" }]}>
                <Ionicons name={cfg.icon} size={24} color={cfg.color} />
            </View>
            <View style={styles.cardContent}>
                <Text style={[styles.chatName, { color: colors.text }]}>{chat.name}</Text>
                <Text style={[styles.chatType, { color: colors.textSecondary }]}>{cfg.label}</Text>
            </View>
            {isAdmin && chat.chat_type === "PRIVATE" && (
                <TouchableOpacity onPress={onManageMembers} hitSlop={8} style={styles.manageBtn}>
                    <Ionicons name="person-add-outline" size={20} color={colors.primary} />
                </TouchableOpacity>
            )}
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
        </TouchableOpacity>
    )
}

// ─── Queries ─────────────────────────────────────────────────────────────────

async function getGroupInfo(groupId: string, userId: string): Promise<GroupInfo | null> {
    const { data, error } = await supabase
        .from("group_room")
        .select("group_id, group_name, group_members!inner (FK_user_id, user_role)")
        .eq("group_id", groupId)
        .eq("group_members.FK_user_id", userId)
        .single()

    if (error || !data) return null
    const member = (data.group_members as any)[0]
    return {
        group_id: data.group_id,
        group_name: data.group_name,
        userRole: member?.user_role ?? "MEMBER",
    }
}

async function getGroupChats(groupId: string, userId: string): Promise<GroupChat[]> {
    const { data, error } = await supabase
        .from("chat_room")
        .select("chat_id, name, chat_type, chat_members!inner (FK_user_id)")
        .eq("FK_group_id", groupId)
        .eq("chat_members.FK_user_id", userId)
        .order("chat_type", { ascending: true })

    if (error || !data) return []
    return data.map(({ chat_id, name, chat_type }) => ({ chat_id, name, chat_type })) as GroupChat[]
}

async function getEligibleMembers(groupId: string, chatId: string): Promise<UserSearchResult[]> {
    const [{ data: groupMembers }, { data: chatMembers }] = await Promise.all([
        supabase
            .from("group_members")
            .select("FK_user_id, user_profile (username)")
            .eq("FK_group_id", groupId),
        supabase
            .from("chat_members")
            .select("FK_user_id")
            .eq("FK_chat_id", chatId),
    ])

    const inChat = new Set((chatMembers ?? []).map(m => m.FK_user_id))

    return (groupMembers ?? [])
        .filter(m => !inChat.has(m.FK_user_id))
        .map(m => ({
            user_id: m.FK_user_id,
            username: (m.user_profile as any)?.username ?? "—",
        }))
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    center:    { flex: 1, justifyContent: "center", alignItems: "center" },
    container: { flex: 1 },
    header: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.md,
        padding: Spacing.lg,
        borderBottomWidth: 1,
    },
    backBtn:   { padding: Spacing.xs },
    groupName: { ...Typography.h3, flex: 1 },
    list:      { padding: Spacing.lg, gap: Spacing.sm },
    card: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.md,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        padding: Spacing.md,
        shadowColor: "#000",
        shadowRadius: 4,
        elevation: 2,
    },
    iconContainer: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" },
    cardContent:   { flex: 1, gap: Spacing.xs },
    chatName:      { ...Typography.body, fontWeight: "600" },
    chatType:      { ...Typography.caption },
    manageBtn:     { padding: 4 },
    empty:         { alignItems: "center", marginTop: 60, gap: Spacing.md },
    emptyText:     { ...Typography.bodySmall },
    createCard: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.sm,
        borderWidth: 1,
        borderStyle: "dashed",
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        marginTop: Spacing.sm,
        justifyContent: "center",
    },
    createCardText: { ...Typography.body, fontWeight: "600" },
    overlay: { flex: 1, backgroundColor: "#00000066", justifyContent: "center", padding: Spacing.xl },
    modal:   { borderRadius: BorderRadius.xl, padding: Spacing.xl, gap: Spacing.md },
    modalTitle: { ...Typography.h3, fontWeight: "700" },
    modalActions: { flexDirection: "row", gap: Spacing.sm, marginTop: Spacing.xs },
    typeLabel:  { ...Typography.caption, marginBottom: -Spacing.xs },
    typeOption: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.sm,
        borderWidth: 1,
        borderRadius: BorderRadius.md,
        padding: Spacing.sm,
    },
    typeName: { fontSize: 14, fontWeight: "600" },
    memberHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    memberList:   { maxHeight: 220 },
    memberRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.sm,
        paddingVertical: Spacing.sm,
        borderBottomWidth: 1,
    },
    memberAvatar:  { width: 34, height: 34, borderRadius: 17, justifyContent: "center", alignItems: "center" },
    memberInitial: { fontSize: 14, fontWeight: "700" },
    memberName:    { flex: 1, fontSize: 14 },
    noMembers:     { fontSize: 13, textAlign: "center", paddingVertical: Spacing.lg },
})
