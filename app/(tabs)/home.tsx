import { joinGroup, leaveGroup } from "@/src/actions";
import {
  Button, Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle
} from "@/src/components/ui";
import { supabase } from "@/src/lib/supabase";
import { getCurrentUser } from "@/src/services/getCurrentUser";
import { Ionicons } from "@expo/vector-icons";
import { Redirect, router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { FlatList } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

type Group = {
  id: string,
  name: string,
  memberCount: number
}

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [groups, setGroups] = useState<Group[]>([])
  const [joinedGroups, setJoinedGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)

  async function loadData() {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      setLoading(false)
      return
    }
    setUser(currentUser)
    const [allGroups, myGroups] = await Promise.all([
      getAllGroups(),
      getJoinedGroups(currentUser.id),
    ])
    setGroups(allGroups)
    setJoinedGroups(myGroups)
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

  const notJoinedGroups = groups.filter(
    g => !joinedGroups.some(jg => jg.id === g.id)
  )

  if (groups.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Ionicons name="people-outline" size={42} />
          </EmptyMedia>
          <EmptyTitle> No hay ningun grupo creado </EmptyTitle>
          <EmptyDescription> Espera a que un administrador cree un grupo</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button
            title="Refrescar"
            onPress={() => router.push("/groups/newGroupPage")}
          />
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Grupos</Text>
        <Button
          title="Nuevo grupo"
          onPress={() => router.push("/groups/newGroupPage" as any)}
          size="small"
        />
      </View>
      <GroupList
        title="Tus Grupos"
        groups={joinedGroups}
        isJoined
        onAction={loadData}
      />
      <GroupList
        title="Grupos Disponibles"
        groups={notJoinedGroups}
        isJoined={false}
        onAction={loadData}
      />
    </SafeAreaView>
  )
}

function GroupList({
  title,
  groups,
  isJoined,
  onAction,
}: {
  title: string,
  groups: Group[],
  isJoined: boolean,
  onAction: () => void
}) {
  if (groups.length === 0) return null

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <FlatList
        data={groups}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <GroupCard {...item} isJoined={isJoined} onAction={onAction} />
        )}
        scrollEnabled={false}
      />
    </View>
  )
}

function GroupCard({
  id,
  name,
  memberCount,
  isJoined,
  onAction,
}: Group & { isJoined: boolean; onAction: () => void }) {
  const [loadingAction, setLoadingAction] = useState(false)

  async function handleJoin() {
    setLoadingAction(true)
    await joinGroup(id)
    onAction()
    setLoadingAction(false)
  }

  async function handleLeave() {
    setLoadingAction(true)
    await leaveGroup(id)
    onAction()
    setLoadingAction(false)
  }

  return (
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
              onPress={() => router.push({ pathname: "/groups/[id]" as any, params: { id } })}
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

async function getAllGroups(): Promise<Group[]> {
  const { data, error } = await supabase
    .from("group_room")
    .select("group_id, group_name, group_members (count)")
    .order("group_name", { ascending: true })

  if (error || !data) return []

  return data.map((g) => ({
    id: g.group_id,
    name: g.group_name,
    memberCount: (g.group_members as any)[0]?.count ?? 0,
  }))
}

async function getJoinedGroups(userId: string): Promise<Group[]> {
  const { data, error } = await supabase
    .from("group_room")
    .select("group_id, group_name, group_members (FK_user_id)")
    .order("group_name", { ascending: true })

  if (error || !data) return []

  return data
    .filter(g => g.group_members.some((m: any) => m.FK_user_id === userId))
    .map((g) => ({
      id: g.group_id,
      name: g.group_name,
      memberCount: g.group_members.length,
    }))
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 24 },
  pageHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  pageTitle: { fontSize: 22, fontWeight: "700" },
  section: { gap: 12 },
  sectionTitle: { fontSize: 20, fontWeight: "600" },
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 16, marginBottom: 10, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardHeader: { marginBottom: 12, gap: 4 },
  cardTitle: { fontSize: 16, fontWeight: "600" },
  cardDescription: { fontSize: 13, color: "#6b7280" },
  cardFooter: { flexDirection: "row" },
  btn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  btnPrimary: { backgroundColor: "#6366f1" },
  btnDanger: { backgroundColor: "#ef4444" },
  btnOutline: { borderWidth: 1, borderColor: "#6366f1" },
  btnText: { color: "#fff", fontWeight: "500", fontSize: 13 },
  btnOutlineText: { color: "#6366f1", fontWeight: "500", fontSize: 13 },
})
