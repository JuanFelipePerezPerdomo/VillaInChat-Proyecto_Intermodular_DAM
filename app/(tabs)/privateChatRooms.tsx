import { leaveRoom } from "@/src/actions";
import {
  Button, Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle
} from "@/src/components/ui";
import { useTheme } from "@/src/hooks";
import { supabase } from "@/src/lib/supabase";
import { getCurrentUser } from "@/src/services/getCurrentUser";
import { Ionicons } from "@expo/vector-icons";
import { Redirect, router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { FlatList } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

type Room = {
  id: string,
  name: string,
  memberCount: number
}

const ICON_COLORS = [
  "#FFD700", "#87CEEB", "#FFB6C1", "#90EE90",
  "#E0E0E0", "#40E0D0", "#A0522D", "#FFA07A",
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
            <EmptyTitle> No tienes chats privados </EmptyTitle>
            <EmptyDescription> Crea un nuevo chat privado</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              title="Crear un nuevo chat"
              onPress={() => router.push("/rooms/newRoomPage")}
            />
          </EmptyContent>
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.pageHeader}>
          <Text style={[styles.pageTitle, { color: colors.text }]}>Chats Privados</Text>
          <Button
            title="Nuevo chat"
            onPress={() => router.push("/rooms/newRoomPage" as any)}
            size="small"
          />
        </View>
        <RoomList
          title="Tus Chats Privados"
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
      <Text style={[styles.sectionTitle, { color: isDark ? colors.text : "#000000" }]}>{title}</Text>
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
  onAction,
}: Room & { onAction: () => void }) {
  const [loadingAction, setLoadingAction] = useState(false)
  const { colors, isDark } = useTheme()

  async function handleLeave() {
    setLoadingAction(true)
    await leaveRoom(id)
    onAction()
    setLoadingAction(false)
  }

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface }]}
      onPress={() => router.push({ pathname: "/rooms/[id]" as any, params: { id } })}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, { color: isDark ? colors.text : "#000000" }]}>{name}</Text>
        <Text style={[styles.cardDescription, { color: isDark ? colors.textSecondary : "#000000" }]}>
          {memberCount} {memberCount === 1 ? "miembro" : "miembros"}
        </Text>
      </View>
      <View style={styles.cardFooter}>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: colors.error }]}
          onPress={handleLeave}
          disabled={loadingAction}
        >
          <Text style={[styles.btnText, { color: colors.onPrimary }]}>
            {loadingAction ? "..." : "Salir"}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  )
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
  const [addHovered, setAddHovered] = useState(false)

  async function handleLeave(id: string) {
    setLoadingId(id)
    await leaveRoom(id)
    onAction()
    setLoadingId(null)
  }

  const items: (Room | null)[] = [...rooms, null]

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.webScrollContainer}>
        <Text style={[styles.webTitle, { color: isDark ? colors.text : "#000000" }]}>chats privados</Text>
        <View style={styles.webGrid}>
          {items.map((room, index) => {
            if (room === null) {
              return (
                <Pressable
                  key="__add__"
                  style={[styles.webCard, {
                    backgroundColor: addHovered ? colors.primaryDark : colors.primary,
                    borderColor: addHovered ? colors.primaryDark : colors.primary,
                  }]}
                  onPress={() => router.push("/rooms/newRoomPage" as any)}
                  onHoverIn={() => setAddHovered(true)}
                  onHoverOut={() => setAddHovered(false)}
                >
                  <Ionicons name="add" size={18} color={addHovered ? colors.onPrimaryHover : colors.onPrimary} />
                  <Text style={[styles.webAddText, { color: addHovered ? colors.onPrimaryHover : colors.onPrimary }]}>Crear nuevo Chat</Text>
                </Pressable>
              )
            }
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

  return data
    .filter(room => room.chat_members.some((u: any) => u.FK_user_id === userId))
    .map((room) => {
      const otherMember = room.chat_members.find((u: any) => u.FK_user_id !== userId)
      const displayName = (otherMember?.user_profile as any)?.username ?? "DM"
      return {
        id: room.chat_id,
        name: displayName,
        memberCount: room.chat_members.length,
      }
    })
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { flex: 1 },
  scrollContainer: { flexGrow: 1, padding: 16, gap: 24 },
  pageHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  pageTitle: { fontSize: 22, fontWeight: "700" },
  section: { gap: 12 },
  sectionTitle: { fontSize: 20, fontWeight: "600" },
  card: { borderRadius: 12, padding: 16, marginBottom: 10, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardHeader: { marginBottom: 12, gap: 4 },
  cardTitle: { fontSize: 16, fontWeight: "600" },
  cardDescription: { fontSize: 13 },
  cardFooter: { flexDirection: "row" },
  btn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  btnText: { fontWeight: "500", fontSize: 13 },
  // Web grid
  webScrollContainer: { padding: 24, paddingLeft: 36, paddingBottom: 48 },
  webTitle: { fontSize: 20, fontWeight: "600", marginBottom: 16 },
  webGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, padding: 16 },
  webCard: { width: "47%", minHeight: 90, borderWidth: 1, borderRadius: 16, padding: 14, flexDirection: "row", alignItems: "center", gap: 10 },
  webIconBox: { width: 32, height: 32, borderRadius: 8, flexShrink: 0 },
  webCardTitle: { fontSize: 14, fontWeight: "600", flexShrink: 1 },
  webAddText: { fontWeight: "600", fontSize: 13 },
})
