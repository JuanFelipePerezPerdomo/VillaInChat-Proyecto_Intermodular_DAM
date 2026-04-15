import { leaveRoom } from "@/src/actions";
import {
  Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle
} from "@/src/components/ui";
import { useTheme } from "@/src/hooks";
import { supabase } from "@/src/lib/supabase";
import { getCurrentUser } from "@/src/services/getCurrentUser";
import { Ionicons } from "@expo/vector-icons";
import { Redirect, router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { FlatList } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

type Room = {
  id: string,
  name: string,
  memberCount: number,
  lastMessage: string,
  lastMessageAt: string | null
}

const ICON_COLORS = [
  "#FFD700", "#87CEEB", "#FFB6C1", "#90EE90",
  "#E0E0E0", "#40E0D0", "#A0522D", "#FFA07A",
  "#C084FC", "#FB923C", "#34D399", "#F472B6",
  "#60A5FA", "#FBBF24", "#A3E635", "#F87171",
  "#38BDF8", "#E879F9", "#4ADE80", "#FDBA74",
]

export default function PrivateChatRooms() {
  const [user, setUser] = useState<any>(null)
  const [joinedRooms, setJoinedRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const { colors } = useTheme()

  async function loadData() {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      setLoading(false)
      return
    }
    setUser(currentUser)
    setJoinedRooms(await getPrivateRooms(currentUser.id))
    setLoading(false)
  }

  useFocusEffect(
    useCallback(() => {
      loadData()
    }, [])
  )

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    )
  }

  if (!user) return <Redirect href={"/SignIn"} />

  if (joinedRooms.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Empty>
          <EmptyHeader>
            <EmptyMedia>
              <Ionicons name="chatbubble-outline" size={42} color={colors.icon} />
            </EmptyMedia>
            <EmptyTitle> No tienes Mensajes Directos </EmptyTitle>
            <EmptyDescription>Cuando te unas a un grupo puedes seleccionar a un compañero y enviarle un mensaje!</EmptyDescription>
          </EmptyHeader>
          <EmptyContent />
        </Empty>
      </SafeAreaView>
    )
  }

  if (Platform.OS === 'web') {
    return (
      <WebRoomGrid
        rooms={joinedRooms}
        onAction={loadData}
      />
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.pageHeader}>
          <Text style={[styles.pageTitle, { color: colors.text }]}>Chats Privados</Text>
        </View>
        <RoomList
          title=""
          rooms={joinedRooms}
          onAction={loadData}
        />
      </ScrollView>
    </SafeAreaView>
  )
}

function RoomList({
  title,
  rooms,
  onAction,
}: {
  title: string,
  rooms: Room[],
  onAction: () => void
}) {
  const { colors, isDark } = useTheme()
  if (rooms.length === 0) return null

  return (
    <View style={styles.section}>
      {title ? <Text style={[styles.sectionTitle, { color: isDark ? colors.text : "#000000" }]}>{title}</Text> : null}
      <FlatList
        data={rooms}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <RoomCard {...item} onAction={onAction} />
        )}
        scrollEnabled={false}
      />
    </View>
  )
}

function RoomCard({
  id,
  name,
  memberCount,
  lastMessage,
  lastMessageAt,
  onAction,
}: Room & { onAction: () => void }) {
  const [loadingAction, setLoadingAction] = useState(false)
  const { colors, isDark } = useTheme()
  const isMobile = Platform.OS !== "web"
  const lastTime = formatLastMessageTime(lastMessageAt)

  async function handleLeave() {
    setLoadingAction(true)
    await leaveRoom(id)
    onAction()
    setLoadingAction(false)
  }

  if (isMobile) {
    return (
      <TouchableOpacity
        style={[styles.mobileRow, { borderBottomColor: colors.border }]}
        onPress={() => router.push({ pathname: "/rooms/[id]" as any, params: { id } })}
        activeOpacity={0.75}
        onLongPress={handleLeave}
        disabled={loadingAction}
      >
        <View style={[styles.mobileAvatar, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <Text style={[styles.mobileAvatarText, { color: colors.text }]}>
            {name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.mobileContent}>
          <Text style={[styles.mobileTitle, { color: isDark ? colors.text : "#000000" }]} numberOfLines={1}>
            {name.toUpperCase()}
          </Text>
          <Text style={[styles.mobileSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
            {lastMessage || "Sin mensajes"}
          </Text>
          <Text style={[styles.mobileTime, { color: colors.textTertiary }]}>{lastTime}</Text>
        </View>
      </TouchableOpacity>
    )
  }

  return null
}

function WebRoomGrid({
  rooms,
  onAction,
}: {
  rooms: Room[]
  onAction: () => void
}) {
  const { colors, isDark } = useTheme()
  const [loadingId, setLoadingId] = useState<string | null>(null)

  async function handleLeave(id: string) {
    setLoadingId(id)
    await leaveRoom(id)
    onAction()
    setLoadingId(null)
  }

  const items: Room[] = [...rooms]

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.webScrollContainer}>
        <Text style={[styles.webTitle, { color: isDark ? colors.text : "#000000" }]}>chats privados</Text>
        <View style={styles.webGrid}>
          {items.map((room, index) => {
            const iconColor = ICON_COLORS[index % ICON_COLORS.length]
            return (
              <TouchableOpacity
                key={room.id}
                style={[styles.webCard, { borderColor: isDark ? colors.border : "#000000" }]}
                onPress={() => router.push({ pathname: "/rooms/[id]" as any, params: { id: room.id } })}
                onLongPress={() => handleLeave(room.id)}
                activeOpacity={0.75}
                disabled={loadingId === room.id}
              >
                <View style={[styles.webIconBox, { backgroundColor: iconColor }]} />
                <Text style={[styles.webCardTitle, { color: isDark ? colors.text : "#000000" }]} numberOfLines={2}>
                  {room.name}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

async function getPrivateRooms(userId: string): Promise<Room[]> {
  const { data, error } = await supabase
    .from("chat_room")
    .select("chat_id, chat_members (FK_user_id, user_profile (username))")
    .eq("chat_type", "PRIVATE")
    .is("FK_group_id", null)

  if (error || !data) return []

  const rooms = data
    .filter(room => room.chat_members.some((u: any) => u.FK_user_id === userId))
    .map((room) => ({
      chatId: room.chat_id,
      members: room.chat_members,
    }))

  const roomMessages = await Promise.all(
    rooms.map(async (room) => {
      const { data: lastMsg } = await supabase
        .from("messages")
        .select("content, created_at")
        .eq("FK_chat_id", room.chatId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      return {
        chatId: room.chatId,
        lastMessage: lastMsg?.content ?? "",
        lastMessageAt: lastMsg?.created_at ?? null,
      }
    })
  )

  const lastMessageByChatId = new Map(roomMessages.map((r) => [r.chatId, r.lastMessage]))
  const lastMessageTimeByChatId = new Map(roomMessages.map((r) => [r.chatId, r.lastMessageAt]))

  return rooms
    .map((room) => {
      const chatMembers = room.members as any[]
      const otherMember = chatMembers.find((u: any) => u.FK_user_id !== userId)
      const displayName = (otherMember?.user_profile as any)?.username ?? "DM"
      return {
        id: room.chatId,
        name: displayName,
        memberCount: chatMembers.length,
        lastMessage: lastMessageByChatId.get(room.chatId) ?? "",
        lastMessageAt: lastMessageTimeByChatId.get(room.chatId) ?? null,
      }
    })
}

function formatLastMessageTime(iso: string | null): string {
  if (!iso) return ""
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { flex: 1 },
  scrollContainer: { flexGrow: 1, padding: 16, gap: 24, paddingBottom: 96 },
  pageHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  pageTitle: { fontSize: 22, fontWeight: "700" },
  section: { gap: 12 },
  sectionTitle: { fontSize: 20, fontWeight: "600" },
  mobileRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    gap: 14,
    borderBottomWidth: 2,
  },
  mobileAvatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  mobileAvatarText: {
    fontSize: 30,
    fontWeight: "600",
  },
  mobileContent: {
    flex: 1,
    gap: 10,
  },
  mobileTitle: {
    fontSize: 28,
    fontWeight: "600",
  },
  mobileSubtitle: {
    fontSize: 18,
  },
  mobileTime: {
    fontSize: 13,
    alignSelf: "flex-end",
    marginTop: 6,
  },
  // Web grid
  webScrollContainer: { padding: 24, paddingLeft: 36, paddingBottom: 48 },
  webTitle: { fontSize: 20, fontWeight: "600", marginBottom: 16 },
  webGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, padding: 16 },
  webCard: { width: "47%", minHeight: 90, borderWidth: 1, borderRadius: 16, padding: 14, flexDirection: "row", alignItems: "center", gap: 10 },
  webIconBox: { width: 32, height: 32, borderRadius: 8, flexShrink: 0 },
  webCardTitle: { fontSize: 14, fontWeight: "600", flexShrink: 1 },
  webAddText: { fontWeight: "600", fontSize: 13 },
})
