import { RoomList } from "@/src/components/rooms";
import { Button, Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/src/components/ui";
import { useTheme } from "@/src/hooks";
import { getCurrentUser } from "@/src/services/getCurrentUser";
import { Ionicons } from "@expo/vector-icons";
import { Redirect, router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Room = {
  id: string,
  name: string,
  memberCount: number
}

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [publicRooms, setPublicRooms] = useState<Room[]>([]);
  const [joinedRooms, setJoinedRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const { colors } = useTheme();

  async function loadData() {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      setLoading(false)
      return
    }
    setUser(currentUser)
    const [pub, joined] = await Promise.all([
      getPublicRooms(),
      getJoinedRooms(currentUser.id),
    ])
    setPublicRooms(pub)
    setJoinedRooms(joined)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  if (loading) return <View style={[styles.center, { backgroundColor: colors.background }]}><ActivityIndicator color={colors.primary} /></View>;
  if (!user) return <Redirect href="/SignIn" />;

  const notJoinedPublicRooms = publicRooms.filter(
    room => !joinedRooms.some(r => r.id === room.id)
  )

//En español si no existe ningun chat en la base de datos muestra esto
  if(publicRooms.length === 0 && joinedRooms.length === 0){
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Ionicons name="chatbubble-outline" size={42} color={colors.icon} />
            </EmptyMedia>
            <EmptyTitle>No hay ningun chat creado</EmptyTitle>
            <EmptyDescription>Cree un nuevo chat</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button title="Crear un nuevo chat" onPress={() => router.push("/rooms/newRoomPage")} />
          </EmptyContent>
        </Empty>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <RoomList title="Tus Chats" rooms={joinedRooms} isJoined onAction={loadData} />
        <RoomList title="Chats Publicos" rooms={notJoinedPublicRooms} isJoined={false} onAction={loadData} />
      </ScrollView>
    </SafeAreaView>
  )
}

/* Tengo la sensacion de que esto es una mala practica o una organizacion que se sigue en next.js
  como esta en el tutorial que te estoy viendo para conseguir esto, probablemente mas adelante mueva
  estascosas a components eso lo tengo que consultar con el profesor y con mis compañeros ya que
  no estoy familiarizado cn el ecosistema de Next y sobre todo en como adaptar cosas de Next a Node */

function RoomList({
  title,
  rooms,
  isJoined,
  onAction,
}:{
  title: string,
  rooms: Room[],
  isJoined: boolean,
  onAction: () => void
}) {
  if(rooms.length === 0) return null

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
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
          <RoomCard {...item} isJoined={isJoined} onAction={onAction}/>
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
}: Room & {isJoined: boolean; onAction: () => void }) {
  const [loadingAction, setLoadingAction] = useState(false)

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

  return(
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{name}</Text>
        <Text style={styles.cardDescription}>
          {memberCount} {memberCount === 1 ? "miembro" : "miembros"}
        </Text>
      </View>
      <View style={styles.cardFooter}>
        {isJoined ? (
          <>
            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary, { flex: 1, marginRight: 8 }]}
              onPress={() => router.push({ pathname: "/rooms/[id]", params: { id } })}
            >
              <Text style={styles.btnText}>Entrar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.btnDanger]}
              onPress={handleLeave}
              disabled={loadingAction}
            >
              <Text style={styles.btnText}>
                {loadingAction ? "..." : "Salir"}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={[styles.btn, styles.btnOutline, { flex: 1 }]}
            onPress={handleJoin}
            disabled={loadingAction}
          >
            <Text style={styles.btnOutlineText}>
              {loadingAction ? "Uniéndose..." : "Unirse"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

/* Esta funcion probablemente sea cambiada o eliminada a posterior teniendo en cuenta que hay que 
  refactorizar la db por que se supone que hay chats privados y "publicos" pero los "publicos" mas bien
  actuan como servidores, ya que un servidor cuenta con varios chats al tener por ejemplo un chat
  de anuncios donde solo los admins pueden postear mensajes
*/
async function getPublicRooms(): Promise<Room[]> {
  const { data, error } = await supabase
  .from("chat_room")
  .select("chat_id, name, chat_members (count)")
  .eq("is_public", true)
  .order("name", { ascending: true })

  if ( error || !data ) return [];

  return data.map((room) => ({
    id: room.chat_id,
    name: room.name,
    memberCount: (room.chat_members as any)[0]?.count ?? 0,
  }))
}

/* Misma logica para este, probablemente la version final muestre todos los chats personales
que tu tienes en vez de un sistema de dame los chats en donde estoy unido que sean privados */
async function getJoinedRooms(userId: string): Promise<Room[]> {
  const { data, error } = await supabase
  .from("chat_room")
  .select("chat_id, name, chat_members (FK_user_id)")
  .order("name", { ascending: true })

  if ( error || !data ) return [];

  return data
  .filter(room => room.chat_members.some((u: any) => u.FK_user_id === userId))
  .map((room) => ({
    id: room.chat_id,
    name: room.name,
    memberCount: room.chat_members.length
  }))
}

// no voy a mentir este StyleSheet me dan ganas de matarme
const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { flex: 1 },
  scrollContainer: { flexGrow: 1, padding: 16, gap: 24 },
});
