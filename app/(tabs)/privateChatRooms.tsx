import { joinRoom, leaveRoom } from "@/src/actions";
import {
  Button, Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle
} from "@/src/components/ui";
import { useTheme } from "@/src/hooks";
import { supabase } from "@/src/lib/supabase";
import { getCurrentUser } from "@/src/services/getCurrentUser";
import { Ionicons } from "@expo/vector-icons";
import { Redirect, router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { FlatList } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

type Room = {
  id: string,
  name: string,
  memberCount: number
}

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

  useEffect(() => {
    loadData()
  }, [])

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
      </View>
    )
  }

  if (!user) return <Redirect href={"/SignIn"} />

  if (joinedRooms.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Ionicons name="chatbubble-outline" size={42} />
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
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <RoomList
        title="Tus Chats Privados"
        rooms={joinedRooms}
        isJoined
        onAction={loadData}
      />
    </SafeAreaView>
  )
}

function RoomList({
  title,
  rooms,
  isJoined,
  onAction,
}: {
  title: string,
  rooms: Room[],
  isJoined: boolean,
  onAction: () => void
}) {
  const { colors } = useTheme()
  if (rooms.length === 0) return null

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
        <Button
          title="Crear un nuevo chat"
          onPress={() => router.push("/rooms/newRoomPage")}
          size="small"
        />
      </View>
      <FlatList
        data={rooms}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <RoomCard {...item} isJoined={isJoined} onAction={onAction} />
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
  isJoined,
  onAction,
}: Room & { isJoined: boolean; onAction: () => void }) {
  const [loadingAction, setLoadingAction] = useState(false)
  const { colors } = useTheme()

  async function handleJoin() {
    setLoadingAction(true);
    await joinRoom(id)
    onAction()
    setLoadingAction(false)
  }

  async function handleLeave() {
    setLoadingAction(true)
    await leaveRoom(id)
    onAction()
    setLoadingAction(false)
  }

  return (
    <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.text }]}>
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, { color: colors.textTertiary }]}>{name}</Text>
        <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
          {memberCount} {memberCount === 1 ? "miembro" : "miembros"}
        </Text>
      </View>
      <View style={styles.cardFooter}>
        {isJoined ? (
          <>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: colors.primary, flex: 1, marginRight: 8 }]}
              onPress={() => router.push({ pathname: "/rooms/[id]", params: { id } })}
            >
              <Text style={[styles.btnText, { color: colors.textTertiary }]}>Entrar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: colors.error }]}
              onPress={handleLeave}
              disabled={loadingAction}
            >
              <Text style={[styles.btnText, { color: colors.textTertiary }]}>
                {loadingAction ? "..." : "Salir"}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={[styles.btn, { borderWidth: 1, borderColor: colors.primary, flex: 1 }]}
            onPress={handleJoin}
            disabled={loadingAction}
          >
            <Text style={[styles.btnOutlineText, { color: colors.primary }]}>
              {loadingAction ? "Uniéndose..." : "Unirse"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

async function getPrivateRooms(userId: string): Promise<Room[]> {
  const { data, error } = await supabase
    .from("chat_room")
    .select("chat_id, name, chat_members (FK_user_id)")
    .eq("chat_type", "PRIVATE")
    .is("FK_group_id", null)
    .order("name", { ascending: true })

  if (error || !data) return []

  return data
    .filter(room => room.chat_members.some((u: any) => u.FK_user_id === userId))
    .map((room) => ({
      id: room.chat_id,
      name: room.name,
      memberCount: room.chat_members.length,
    }))
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 24 },
  section: { gap: 12 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { fontSize: 20, fontWeight: "600" },
  card: { borderRadius: 12, padding: 16, marginBottom: 10, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardHeader: { marginBottom: 12, gap: 4 },
  cardTitle: { fontSize: 16, fontWeight: "600" },
  cardDescription: { fontSize: 13 },
  cardFooter: { flexDirection: "row" },
  btn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  btnText: { fontWeight: "500", fontSize: 13 },
  btnOutlineText: { fontWeight: "500", fontSize: 13 },
})
