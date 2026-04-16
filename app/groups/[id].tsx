import { addChatMember, createGroupChat, inviteUserToGroup } from "@/src/actions"
import { ChatPanel, GroupMemberSearch } from "@/src/components/groups"
import { Button, Input, Tooltip, UserSearchPicker } from "@/src/components/ui"
import { useLastGroupChat, useTheme } from "@/src/hooks"
import { supabase } from "@/src/lib/supabase"
import { useUserSheet } from "@/src/providers/UserSheetProvider"
import { getCurrentUser } from "@/src/services/getCurrentUser"
import { UserSearchResult } from "@/src/services/searchUsers"
import { BorderRadius, Spacing, Typography } from "@/src/themes"
import { Ionicons } from "@expo/vector-icons"
import { router, useLocalSearchParams } from "expo-router"
import { useEffect, useState } from "react"
import {
    ActivityIndicator, BackHandler, FlatList, Modal, StyleSheet,
    Text, TouchableOpacity, useWindowDimensions, View, KeyboardAvoidingView, Platform
} from "react-native"
import { Gesture, GestureDetector } from "react-native-gesture-handler"
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated"
import { SafeAreaView } from "react-native-safe-area-context"

type ChatType = "PRIVATE" | "PUBLIC" | "ANNOUNCEMENTS"

type GroupChat = {
    chat_id: string
    name: string
    chat_type: ChatType
}

type GroupListItem =
    | { kind: "chat"; chat: GroupChat }
    | { kind: "info"; id: string }

type GroupInfo = {
    group_id: string
    group_name: string
    userRole: string
}

type GroupMemberInfo = {
    user_id: string
    username: string
    user_role: string
}

const CHAT_TYPE_CONFIG: Record<ChatType, { icon: keyof typeof Ionicons.glyphMap; label: string; color: string }> = {
    PUBLIC: { icon: "chatbubbles-outline", label: "General", color: "#6366f1" },
    PRIVATE: { icon: "lock-closed-outline", label: "Privado", color: "#6b7280" },
    ANNOUNCEMENTS: { icon: "megaphone-outline", label: "Avisos", color: "#f59e0b" },
}

const CHAT_TYPES: ChatType[] = ["PUBLIC", "PRIVATE", "ANNOUNCEMENTS"]

const SNAP = { duration: 260, easing: Easing.out(Easing.cubic) }

export default function GroupPage() {
    const { id } = useLocalSearchParams<{ id: string }>()
    const { colors } = useTheme()
    const { width: SCREEN_WIDTH } = useWindowDimensions()
    const { openUserSheet } = useUserSheet()
    const { lastChatId, updateLastChat } = useLastGroupChat(id)

    // ── Reanimated: posición horizontal de los dos paneles ───────────────────
    // panelX = 0          → panel de canales visible
    // panelX = -SCREEN_WIDTH → panel de chat visible
    const panelX = useSharedValue(0)
    const startX = useSharedValue(0)

    // ── Estado del grupo ─────────────────────────────────────────────────────
    const [group, setGroup] = useState<GroupInfo | null>(null)
    const [chats, setChats] = useState<GroupChat[]>([])
    const [groupMembers, setGroupMembers] = useState<UserSearchResult[]>([])
    const [allGroupMembers, setAllGroupMembers] = useState<UserSearchResult[]>([])
    const [groupMembersInfo, setGroupMembersInfo] = useState<GroupMemberInfo[]>([])
    const [loading, setLoading] = useState(true)
    const [isAdmin, setIsAdmin] = useState(false)
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)
    const [infoVisible, setInfoVisible] = useState(false)

    // ── Chat activo (panel derecho) ──────────────────────────────────────────
    const [activeChatId, setActiveChatId] = useState<string | null>(null)
    const [activeChatName, setActiveChatName] = useState("")

    // ── Modal: crear chat ────────────────────────────────────────────────────
    const [createVisible, setCreateVisible] = useState(false)
    const [newChatName, setNewChatName] = useState("")
    const [newChatType, setNewChatType] = useState<ChatType>("PUBLIC")
    const [creating, setCreating] = useState(false)

    // ── Modal: invitar usuario al grupo ──────────────────────────────────────
    const [inviteVisible, setInviteVisible] = useState(false)
    const [inviteSelected, setInviteSelected] = useState<UserSearchResult[]>([])
    const [inviting, setInviting] = useState(false)

    // ── Modal: añadir miembros a chat privado ────────────────────────────────
    const [memberChatId, setMemberChatId] = useState<string | null>(null)
    const [eligibleMembers, setEligibleMembers] = useState<UserSearchResult[]>([])
    const [memberSearch, setMemberSearch] = useState("")
    const [addingId, setAddingId] = useState<string | null>(null)
    const [loadingMembers, setLoadingMembers] = useState(false)

    useEffect(() => { loadData() }, [id])

    // Android hardware back: si no hay stack (abierto desde notificación), ir al home
    useEffect(() => {
        const handler = BackHandler.addEventListener("hardwareBackPress", () => {
            if (router.canGoBack()) {
                router.back()
            } else {
                router.replace("/(tabs)/home")
            }
            return true
        })
        return () => handler.remove()
    }, [])

    // Pre-cargar el último chat visitado cuando AsyncStorage y chats ya estén listos
    useEffect(() => {
        if (lastChatId && chats.length > 0 && !activeChatId) {
            const found = chats.find(c => c.chat_id === lastChatId)
            if (found) {
                setActiveChatId(found.chat_id)
                setActiveChatName(found.name)
            }
        }
    }, [lastChatId, chats])

    async function loadData() {
        const user = await getCurrentUser()
        if (!user) { router.replace("/SignIn"); return }
        setCurrentUserId(user.id)

        const [groupData, chatsData, membersData, allMembersData, membersInfoData] = await Promise.all([
            getGroupInfo(id, user.id),
            getGroupChats(id, user.id),
            getGroupMembers(id, user.id),          // excludes self → invite modal
            getAllGroupMembers(id),                 // includes self → mention dropdown
            getGroupMembersWithRole(id),            // with role → info modal
        ])

        if (!groupData) { router.replace("/home"); return }

        setGroup(groupData)
        setIsAdmin(groupData.userRole === "ADMIN")
        setChats(chatsData)
        setGroupMembers(membersData)         // excludes self → invite modal
        setAllGroupMembers(allMembersData)   // includes self → mention dropdown
        setGroupMembersInfo(membersInfoData) // with role → info modal
        setLoading(false)
    }

    async function reloadChats() {
        if (!currentUserId) return
        setChats(await getGroupChats(id, currentUserId))
    }

    // ── Navegación entre paneles ─────────────────────────────────────────────
    function goToChat(chatId: string, chatName: string) {
        setActiveChatId(chatId)
        setActiveChatName(chatName)
        updateLastChat(chatId)
        panelX.value = withTiming(-SCREEN_WIDTH, SNAP)
    }

    function goToChannels() {
        panelX.value = withTiming(0, SNAP)
    }

    // ── Gesto de swipe entre paneles ─────────────────────────────────────────
    // Soporta ambas direcciones:
    // · Swipe IZQUIERDA desde canales → chat
    // · Swipe DERECHA desde chat → canales
    const panGesture = Gesture.Pan()
        .activeOffsetX([-12, 12])
        .failOffsetY([-20, 20])
        .onBegin(() => {
            startX.value = panelX.value
        })
        .onUpdate((e) => {
            const next = startX.value + e.translationX
            panelX.value = Math.max(-SCREEN_WIDTH, Math.min(0, next))
        })
        .onEnd((e) => {
            const HALF = SCREEN_WIDTH / 2
            const shouldGoToChat =
                panelX.value < -HALF || (startX.value === 0 && e.velocityX < -400)
            panelX.value = withTiming(shouldGoToChat ? -SCREEN_WIDTH : 0, SNAP)
        })

    const panelAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: panelX.value }],
    }))

    // ── Modales ──────────────────────────────────────────────────────────────

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

    async function handleInviteUsers() {
        if (inviteSelected.length === 0) return
        setInviting(true)
        await Promise.all(inviteSelected.map(u => inviteUserToGroup(id, u.user_id)))
        setInviting(false)
        setInviteVisible(false)
        setInviteSelected([])
        await loadData()
    }

    function closeInviteModal() { setInviteVisible(false); setInviteSelected([]) }
    function closeMemberModal() { setMemberChatId(null); setEligibleMembers([]); setMemberSearch("") }
    function closeCreateModal() { setCreateVisible(false); setNewChatName(""); setNewChatType("PUBLIC") }

    async function handleToggleClassRep(userId: string, currentRole: string) {
        const newRole = currentRole === "CLASS_REP" ? "MEMBER" : "CLASS_REP"
        await supabase
            .from("group_members")
            .update({ user_role: newRole })
            .eq("FK_group_id", id)
            .eq("FK_user_id", userId)
        // Refresh member info
        setGroupMembersInfo(await getGroupMembersWithRole(id))
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

    const listItems: GroupListItem[] = (() => {
        const infoItem: GroupListItem = { kind: "info", id: "__group_info__" }
        const items = chats.map((chat) => ({ kind: "chat", chat }) as GroupListItem)
        const announcementsIndex = items.findIndex(
            (item) => item.kind === "chat" && item.chat.chat_type === "ANNOUNCEMENTS"
        )
        if (announcementsIndex >= 0) {
            const next = [...items]
            next.splice(announcementsIndex + 1, 0, infoItem)
            return next
        }
        return [...items, infoItem]
    })()

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <KeyboardAvoidingView 
                style={{ flex: 1 }} 
                behavior={Platform.OS === "ios" ? "padding" : "height"} 
                keyboardVerticalOffset={0}
            >
                {/* ─── Contenedor horizontal de dos paneles ─────────────────────── */}
                {/* El overflow:hidden recorta el panel derecho cuando no está visible */}
                <View style={styles.panelsWrapper}>
                <GestureDetector gesture={panGesture}>
                    <Animated.View
                        style={[
                            styles.panelsRow,
                            { width: SCREEN_WIDTH * 2 },
                            panelAnimatedStyle,
                        ]}
                    >
                        {/* ── Panel izquierdo: lista de canales ──────────────── */}
                        <View style={[styles.panel, { width: SCREEN_WIDTH }]}>

                            {/* Header del grupo */}
                            <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                                <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)/home")} style={styles.backBtn}>
                                    <Ionicons name="arrow-back" size={22} color={colors.primary} />
                                </TouchableOpacity>
                                <Text style={[styles.groupName, { color: colors.text }]}>{group?.group_name}</Text>
                                <GroupMemberSearch
                                    members={groupMembers}
                                    onSelectUser={(user) => openUserSheet(user)}
                                />
                                {isAdmin && (
                                    <Tooltip text="Invitar al grupo">
                                        <TouchableOpacity
                                            onPress={() => setInviteVisible(true)}
                                            hitSlop={8}
                                            style={styles.headerBtn}
                                        >
                                            <Ionicons name="person-add-outline" size={22} color={colors.primary} />
                                        </TouchableOpacity>
                                    </Tooltip>
                                )}
                            </View>

                            {/* Lista de chats */}
                            <FlatList
                                data={listItems}
                                keyExtractor={(item) => item.kind === "chat" ? item.chat.chat_id : item.id}
                                contentContainerStyle={styles.list}
                                renderItem={({ item }) => (
                                    item.kind === "chat" ? (
                                        <ChatCard
                                            chat={item.chat}
                                            isAdmin={isAdmin}
                                            isActive={item.chat.chat_id === activeChatId}
                                            onPress={() => goToChat(item.chat.chat_id, item.chat.name)}
                                            onManageMembers={() => openMemberSearch(item.chat.chat_id)}
                                        />
                                    ) : (
                                        <TouchableOpacity
                                            style={[styles.infoCard, { borderColor: colors.border, backgroundColor: colors.card }]}
                                            onPress={() => setInfoVisible(true)}
                                            activeOpacity={0.8}
                                        >
                                            <View style={[styles.infoCardIcon, { backgroundColor: colors.primary + "18" }]}>
                                                <Ionicons name="information-circle-outline" size={22} color={colors.primary} />
                                            </View>
                                            <View style={styles.cardContent}>
                                                <Text style={[styles.chatName, { color: colors.text }]}>Información del grupo</Text>
                                                <Text style={[styles.chatType, { color: colors.textSecondary }]}>
                                                    Administrador y miembros del grupo
                                                </Text>
                                            </View>
                                            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                                        </TouchableOpacity>
                                    )
                                )}
                                ListEmptyComponent={
                                    <View style={styles.empty}>
                                        <Ionicons name="chatbubble-outline" size={40} color={colors.border} />
                                        <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
                                            No hay chats en este grupo
                                        </Text>
                                    </View>
                                }
                                ListFooterComponent={isAdmin ? (
                                    <TouchableOpacity
                                        style={[styles.createCard, {
                                            borderColor: colors.primary,
                                            backgroundColor: colors.primary + "0d",
                                        }]}
                                        onPress={() => setCreateVisible(true)}
                                    >
                                        <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
                                        <Text style={[styles.createCardText, { color: colors.primary }]}>
                                            Crear nuevo chat
                                        </Text>
                                    </TouchableOpacity>
                                ) : null}
                            />
                        </View>

                        {/* ── Panel derecho: chat activo ─────────────────────── */}
                        <View style={[styles.panel, { width: SCREEN_WIDTH, backgroundColor: colors.background }]}>
                            {activeChatId ? (
                                <ChatPanel
                                    chatId={activeChatId}
                                    chatName={activeChatName}
                                    onBack={goToChannels}
                                    groupMembers={allGroupMembers}
                                    chatType={chats.find(c => c.chat_id === activeChatId)?.chat_type}
                                    userGroupRole={group?.userRole}
                                />
                            ) : (
                                <View style={styles.noChat}>
                                    <Ionicons name="chatbubble-ellipses-outline" size={52} color={colors.border} />
                                    <Text style={[styles.noChatText, { color: colors.textTertiary }]}>
                                        Selecciona un chat
                                    </Text>
                                </View>
                            )}
                        </View>
                    </Animated.View>
                </GestureDetector>
            </View>
            </KeyboardAvoidingView>

            {/* ─── Modales ──────────────────────────────────────────────────── */}

            {/* Mas informacion del grupo */}
            <Modal visible={infoVisible} transparent animationType="fade" onRequestClose={() => setInfoVisible(false)}>
                <View style={styles.overlay}>
                    <View style={[styles.modal, { backgroundColor: colors.card }]}>
                        <View style={styles.memberHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>Mas informacion</Text>
                            <TouchableOpacity onPress={() => setInfoVisible(false)} hitSlop={8}>
                                <Ionicons name="close" size={22} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <View style={[styles.infoBlock, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Administrador</Text>
                            {groupMembersInfo.filter(m => m.user_role === "ADMIN").length === 0 ? (
                                <Text style={[styles.infoValue, { color: colors.text }]}>No definido</Text>
                            ) : (
                                groupMembersInfo
                                    .filter(m => m.user_role === "ADMIN")
                                    .map((admin) => (
                                        <TouchableOpacity
                                            key={admin.user_id}
                                            style={styles.infoMemberRow}
                                            onPress={() => {
                                                setInfoVisible(false)
                                                openUserSheet({
                                                    user_id: admin.user_id,
                                                    username: admin.username,
                                                    groupId: id,
                                                    isCurrentUserAdmin: isAdmin,
                                                    targetUserRoleInGroup: admin.user_role,
                                                    onRoleToggle: () => handleToggleClassRep(admin.user_id, admin.user_role)
                                                })
                                            }}
                                        >
                                            <Ionicons name="shield-checkmark-outline" size={18} color={colors.primary} />
                                            <Text style={[styles.infoValue, { color: colors.text }]}>{admin.username}</Text>
                                        </TouchableOpacity>
                                    ))
                            )}
                        </View>

                        <View style={[styles.infoBlock, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Delegados de clase</Text>
                            {groupMembersInfo.filter(m => m.user_role === "CLASS_REP").length === 0 ? (
                                <Text style={[styles.infoValue, { color: colors.text }]}>Sin delegados asignados</Text>
                            ) : (
                                groupMembersInfo
                                    .filter(m => m.user_role === "CLASS_REP")
                                    .map((rep) => (
                                        <TouchableOpacity
                                            key={rep.user_id}
                                            style={styles.infoMemberRow}
                                            onPress={() => {
                                                setInfoVisible(false)
                                                openUserSheet({
                                                    user_id: rep.user_id,
                                                    username: rep.username,
                                                    groupId: id,
                                                    isCurrentUserAdmin: isAdmin,
                                                    targetUserRoleInGroup: rep.user_role,
                                                    onRoleToggle: () => handleToggleClassRep(rep.user_id, rep.user_role)
                                                })
                                            }}
                                        >
                                            <Ionicons name="star-outline" size={18} color="#f59e0b" />
                                            <Text style={[styles.infoValue, { color: colors.text }]}>{rep.username}</Text>
                                        </TouchableOpacity>
                                    ))
                            )}
                        </View>

                        <View style={[styles.infoBlock, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Miembros del grupo</Text>
                            <FlatList
                                data={groupMembersInfo}
                                keyExtractor={(m) => m.user_id}
                                style={styles.infoList}
                                renderItem={({ item }) => (
                                    <View style={[styles.infoMemberRow, { borderBottomColor: colors.border }]}>
                                        <TouchableOpacity
                                            style={{ flexDirection: "row", alignItems: "center", gap: Spacing.sm, flex: 1 }}
                                            onPress={() => {
                                                setInfoVisible(false)
                                                openUserSheet({
                                                    user_id: item.user_id,
                                                    username: item.username,
                                                    groupId: id,
                                                    isCurrentUserAdmin: isAdmin,
                                                    targetUserRoleInGroup: item.user_role,
                                                    onRoleToggle: () => handleToggleClassRep(item.user_id, item.user_role)
                                                })
                                            }}
                                        >
                                            <View style={[styles.memberAvatar, { backgroundColor: colors.primary + "22" }]}>
                                                <Text style={[styles.memberInitial, { color: colors.primary }]}>
                                                    {item.username[0].toUpperCase()}
                                                </Text>
                                            </View>
                                            <Text style={[styles.memberName, { color: colors.text }]}>{item.username}</Text>
                                            {item.user_role === "CLASS_REP" && (
                                                <Ionicons name="star" size={14} color="#f59e0b" />
                                            )}
                                        </TouchableOpacity>
                                        {isAdmin && item.user_role !== "ADMIN" && (
                                            <TouchableOpacity
                                                onPress={() => handleToggleClassRep(item.user_id, item.user_role)}
                                                hitSlop={8}
                                                style={[styles.classRepBtn, {
                                                    borderColor: item.user_role === "CLASS_REP" ? "#f59e0b" : colors.border,
                                                    backgroundColor: item.user_role === "CLASS_REP" ? "#f59e0b" + "15" : "transparent",
                                                }]}
                                            >
                                                <Ionicons
                                                    name={item.user_role === "CLASS_REP" ? "star" : "star-outline"}
                                                    size={14}
                                                    color={item.user_role === "CLASS_REP" ? "#f59e0b" : colors.textSecondary}
                                                />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                )}
                            />
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Invitar al grupo */}
            <Modal visible={inviteVisible} transparent animationType="fade" onRequestClose={closeInviteModal}>
                <View style={styles.overlay}>
                    <View style={[styles.modal, { backgroundColor: colors.card }]}>
                        <View style={styles.memberHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>Invitar al grupo</Text>
                            <TouchableOpacity onPress={closeInviteModal} hitSlop={8}>
                                <Ionicons name="close" size={22} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                        <UserSearchPicker
                            excludeId={currentUserId}
                            selectedUsers={inviteSelected}
                            onAdd={(u) => setInviteSelected(prev => [...prev, u])}
                            onRemove={(uid) => setInviteSelected(prev => prev.filter(u => u.user_id !== uid))}
                            filterUserIds={groupMembers.map(m => m.user_id)}
                        />
                        <View style={styles.modalActions}>
                            <Button title="Cancelar" variant="outline" onPress={closeInviteModal} style={{ flex: 1 }} />
                            <Button
                                title="Invitar"
                                onPress={handleInviteUsers}
                                loading={inviting}
                                disabled={inviteSelected.length === 0}
                                style={{ flex: 1 }}
                            />
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Crear chat */}
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
                                    <Text style={[styles.typeName, { color: selected ? cfg.color : colors.text }]}>
                                        {cfg.label}
                                    </Text>
                                    {selected && (
                                        <Ionicons name="checkmark-circle" size={18} color={cfg.color} style={{ marginLeft: "auto" }} />
                                    )}
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

            {/* Añadir miembros a chat privado */}
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

// ─── ChatCard ─────────────────────────────────────────────────────────────────

function ChatCard({
    chat, isAdmin, isActive, onPress, onManageMembers,
}: {
    chat: GroupChat
    isAdmin: boolean
    isActive: boolean
    onPress: () => void
    onManageMembers: () => void
}) {
    const cfg = CHAT_TYPE_CONFIG[chat.chat_type]
    const { colors, isDark } = useTheme()

    return (
        <TouchableOpacity
            style={[
                styles.card,
                {
                    backgroundColor: isActive ? colors.primary + "15" : colors.card,
                    borderColor: isActive ? colors.primary : colors.border,
                    shadowOpacity: isDark ? 0.3 : 0.05,
                },
            ]}
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
    return { group_id: data.group_id, group_name: data.group_name, userRole: member?.user_role ?? "MEMBER" }
}

async function getAllGroupMembers(groupId: string): Promise<UserSearchResult[]> {
    const { data, error } = await supabase
        .from("group_members")
        .select("FK_user_id, user_profile (username)")
        .eq("FK_group_id", groupId)
    if (error || !data) return []
    return data.map(m => ({ user_id: m.FK_user_id, username: (m.user_profile as any)?.username ?? "—" }))
}

async function getGroupMembers(groupId: string, excludeUserId: string): Promise<UserSearchResult[]> {
    const { data, error } = await supabase
        .from("group_members")
        .select("FK_user_id, user_profile (username)")
        .eq("FK_group_id", groupId)
        .neq("FK_user_id", excludeUserId)
    if (error || !data) return []
    return data.map(m => ({ user_id: m.FK_user_id, username: (m.user_profile as any)?.username ?? "—" }))
}

async function getGroupMembersWithRole(groupId: string): Promise<GroupMemberInfo[]> {
    const { data, error } = await supabase
        .from("group_members")
        .select("FK_user_id, user_role, user_profile (username)")
        .eq("FK_group_id", groupId)

    if (error || !data) return []
    return data.map((m: any) => ({
        user_id: m.FK_user_id,
        username: m.user_profile?.username ?? "—",
        user_role: m.user_role ?? "MEMBER",
    }))
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
        supabase.from("group_members").select("FK_user_id, user_profile (username)").eq("FK_group_id", groupId),
        supabase.from("chat_members").select("FK_user_id").eq("FK_chat_id", chatId),
    ])
    const inChat = new Set((chatMembers ?? []).map(m => m.FK_user_id))
    return (groupMembers ?? [])
        .filter(m => !inChat.has(m.FK_user_id))
        .map(m => ({ user_id: m.FK_user_id, username: (m.user_profile as any)?.username ?? "—" }))
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    container: { flex: 1 },

    // Dos paneles horizontales
    panelsWrapper: { flex: 1, overflow: "hidden" },
    panelsRow: { flexDirection: "row", flex: 1 },
    panel: { flex: 1 },  // height fills via alignItems: stretch

    // Panel izquierdo: header
    header: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.md,
        padding: Spacing.lg,
        borderBottomWidth: 1,
        zIndex: 100,
        overflow: "visible",
    },
    backBtn: { padding: Spacing.xs },
    headerBtn: { padding: 4 },
    groupName: { ...Typography.h3, flex: 1 },

    // Lista de chats
    list: { padding: Spacing.lg, gap: Spacing.sm },
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
    cardContent: { flex: 1, gap: Spacing.xs },
    chatName: { ...Typography.body, fontWeight: "600" },
    chatType: { ...Typography.caption },
    manageBtn: { padding: 4 },
    empty: { alignItems: "center", marginTop: 60, gap: Spacing.md },
    emptyText: { ...Typography.bodySmall },
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
    infoCard: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.md,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        padding: Spacing.md,
    },
    infoCardIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: "center",
        alignItems: "center",
    },

    // Panel derecho vacío
    noChat: { flex: 1, justifyContent: "center", alignItems: "center", gap: Spacing.md },
    noChatText: { ...Typography.bodySmall },

    // Modales
    overlay: { flex: 1, backgroundColor: "#00000066", justifyContent: "center", padding: Spacing.xl },
    modal: { borderRadius: BorderRadius.xl, padding: Spacing.xl, gap: Spacing.md },
    modalTitle: { ...Typography.h3, fontWeight: "700" },
    modalActions: { flexDirection: "row", gap: Spacing.sm, marginTop: Spacing.xs },
    typeLabel: { ...Typography.caption, marginBottom: -Spacing.xs },
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
    memberList: { maxHeight: 220 },
    memberRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.sm,
        paddingVertical: Spacing.sm,
        borderBottomWidth: 1,
    },
    memberAvatar: { width: 34, height: 34, borderRadius: 17, justifyContent: "center", alignItems: "center" },
    memberInitial: { fontSize: 14, fontWeight: "700" },
    memberName: { flex: 1, fontSize: 14 },
    noMembers: { fontSize: 13, textAlign: "center", paddingVertical: Spacing.lg },
    infoBlock: {
        borderWidth: 1,
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        gap: Spacing.sm,
    },
    infoLabel: {
        ...Typography.caption,
        fontWeight: "600",
    },
    infoValue: {
        ...Typography.body,
    },
    infoList: {
        maxHeight: 240,
    },
    infoMemberRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.sm,
        paddingVertical: Spacing.sm,
        borderBottomWidth: 1,
    },
    classRepBtn: {
        width: 30,
        height: 30,
        borderRadius: 15,
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center",
    },
})
