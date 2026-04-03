import { joinGroup, leaveGroup } from "@/src/actions";
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

type Group = {
  id: string,
  name: string,
  memberCount: number
}

const ICON_COLORS = [
  "#FFD700", "#87CEEB", "#FFB6C1", "#90EE90",
  "#E0E0E0", "#40E0D0", "#A0522D", "#FFA07A",
]

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [groups, setGroups] = useState<Group[]>([])
  const [joinedGroups, setJoinedGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const { colors } = useTheme()

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

  const notJoinedGroups = groups.filter(
    g => !joinedGroups.some(jg => jg.id === g.id)
  )

  if (groups.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Ionicons name="people-outline" size={42} color={colors.icon} />
            </EmptyMedia>
            <EmptyTitle> No hay ningun grupo creado </EmptyTitle>
            <EmptyDescription> Espera a que un administrador cree un grupo</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              title="Nuevo grupo"
              onPress={() => router.push("/groups/newGroupPage")}
            />
          </EmptyContent>
        </Empty>
      </SafeAreaView>
    );
  }

  if (Platform.OS === 'web') {
    return (
      <WebGroupGrid
        groups={groups}
        joinedGroups={joinedGroups}
        onAction={loadData}
      />
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.pageHeader}>
          <Text style={[styles.pageTitle, { color: colors.text }]}>Grupos</Text>
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
      </ScrollView>
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
  const { colors, isDark } = useTheme()
  if (groups.length === 0) return null

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: isDark ? colors.text : "#000000" }]}>{title}</Text>
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
  const { colors, isDark } = useTheme()

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
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface }]}
      onPress={() => isJoined && router.push({ pathname: "/groups/[id]" as any, params: { id } })}
      activeOpacity={isJoined ? 0.7 : 1}
    >
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, { color: isDark ? colors.text : "#000000" }]}>{name}</Text>
        <Text style={[styles.cardDescription, { color: isDark ? colors.textSecondary : "#000000" }]}>
          {memberCount} {memberCount === 1 ? "miembro" : "miembros"}
        </Text>
      </View>
      {!isJoined && (
        <View style={styles.cardFooter}>
          <TouchableOpacity
            style={[styles.btn, { flex: 1, borderWidth: 1, borderColor: colors.primary }]}
            onPress={handleJoin}
            disabled={loadingAction}
          >
            <Text style={[styles.btnText, { color: colors.primary }]}>
              {loadingAction ? "Uniéndose..." : "Unirse"}
            </Text>
          </TouchableOpacity>
        </View>
      )}
      {isJoined && (
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
      )}
    </TouchableOpacity>
  )
}

function WebGroupGrid({
  groups,
  joinedGroups,
  onAction,
}: {
  groups: Group[]
  joinedGroups: Group[]
  onAction: () => void
}) {
  const { colors, isDark } = useTheme()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [addHovered, setAddHovered] = useState(false)

  async function handlePress(group: Group, isJoined: boolean) {
    if (isJoined) {
      router.push({ pathname: "/groups/[id]" as any, params: { id: group.id } })
    } else {
      setLoadingId(group.id)
      await joinGroup(group.id)
      onAction()
      setLoadingId(null)
    }
  }

  async function handleLeave(id: string) {
    setLoadingId(id)
    await leaveGroup(id)
    onAction()
    setLoadingId(null)
  }

  const items = [...groups, null] // null = botón añadir

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.webScrollContainer}>
        <Text style={[styles.webTitle, { color: isDark ? colors.text : "#000000" }]}>grupos</Text>
        <View style={styles.webGrid}>
          {items.map((group, index) => {
            if (group === null) {
              return (
                <Pressable
                  key="__add__"
                  style={[styles.webCard, {
                    backgroundColor: addHovered ? colors.primaryDark : colors.primary,
                    borderColor: addHovered ? colors.primaryDark : colors.primary,
                  }]}
                  onPress={() => router.push("/groups/newGroupPage" as any)}
                  onHoverIn={() => setAddHovered(true)}
                  onHoverOut={() => setAddHovered(false)}
                >
                  <Ionicons name="add" size={18} color={addHovered ? colors.onPrimaryHover : colors.onPrimary} />
                  <Text style={[styles.webAddText, { color: addHovered ? colors.onPrimaryHover : colors.onPrimary }]}>Añadir nuevo Grupo</Text>
                </Pressable>
              )
            }
            const isJoined = joinedGroups.some(jg => jg.id === group.id)
            const iconColor = ICON_COLORS[index % ICON_COLORS.length]
            return (
              <TouchableOpacity
                key={group.id}
                style={[styles.webCard, { borderColor: isDark ? colors.border : "#000000" }]}
                onPress={() => handlePress(group, isJoined)}
                onLongPress={isJoined ? () => handleLeave(group.id) : undefined}
                activeOpacity={0.75}
                disabled={loadingId === group.id}
              >
                <View style={[styles.webIconBox, { backgroundColor: iconColor }]} />
                <Text style={[styles.webCardTitle, { color: isDark ? colors.text : "#000000" }]} numberOfLines={2}>
                  {group.name}
                </Text>
                {!isJoined && (
                  <Text style={[styles.webJoinHint, { color: colors.textTertiary }]}>Toca para unirte</Text>
                )}
              </TouchableOpacity>
            )
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
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
  webJoinHint: { fontSize: 11, marginTop: 2 },
  webAddText: { color: "#fff", fontWeight: "600", fontSize: 13 },
})
