import { MessageBubble } from "@/src/components/rooms";
import { useTheme } from "@/src/hooks";
import { supabase } from "@/src/lib/supabase";
import { getUserProfile } from "@/src/services/getCurrentUser";
import { getMessages, getRoomById } from "@/src/services/roomService";
import { BorderRadius, Spacing, Typography } from "@/src/themes";
import { MessageWithAuthor } from "@/src/types";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Room = {
    chat_id: string,
    name: string,
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
  const { id } = useLocalSearchParams<{ id: string }>();
  const [room, setRoom] = useState<Room | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [messages, setMessages] = useState<MessageWithAuthor[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const { colors } = useTheme();

  useEffect(() => {
    async function loadData() {
      const [roomData, profileData, messageData] = await Promise.all([
        getRoomById(id),
        getUserProfile(),
        getMessages(id),
      ]);
      if (!roomData || !profileData) { router.replace("/home"); return; }
      setRoom(roomData);
      setUserProfile(profileData);
      setMessages(messageData);
      setLoading(false);
    }
    loadData();
  }, []);

  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`room:${id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `FK_chat_id=eq.${id}` },
        async (payload) => {
          const { data: author } = await supabase
            .from("user_profile").select("username").eq("user_id", payload.new.FK_author_id).single();
          const newMsg: MessageWithAuthor = {
            id: payload.new.id,
            created_at: payload.new.created_at,
            content: payload.new.content,
            FK_author_id: payload.new.FK_author_id,
            author: author ?? null,
          };
          setMessages((prev) => [newMsg, ...prev]);
        }
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id]);

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

  if (loading) return <View style={[styles.center, { backgroundColor: colors.background }]}><ActivityIndicator color={colors.primary} /></View>;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={["top"]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={0}>
        <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.push("/home")} style={styles.backButton}>
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
            <MessageBubble message={item} isOwn={item.FK_author_id === userProfile?.user_id} />
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
            <Ionicons name="send" size={18} color={(!newMessage.trim() || sending) ? colors.textTertiary : "#fff"} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Para lo que estoy haciendo esto se queda aca, pero creo que si o si esto ira a componentes fijo
// Ojala adaptar todo esto sea sencillo...
function MessageBubble({message, isOwn}: { message: Message, isOwn: boolean }){
    const time = new Date(message.created_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    })

    return(
        <View style={[styles.bubbleWrapper, isOwn ? styles.bubbleRight : styles.bubbleLeft]}>
            {!isOwn && (
                <Text style={styles.bubbleAuthor}>{message.author?.username ?? "Desconocido"}</Text>
            )}
            <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
                <Text style={[styles.bubbleText, isOwn && styles.bubbleTextOwn]}>
                    {message.content}
                </Text>
            </View>
            <Text style={[styles.bubbleTime, isOwn && { textAlign: "right" }]}>{time}</Text>
        </View>
    )
}

async function getRoom(roomId: string): Promise<Room | null> {
    const user = await getCurrentUser()
    if (!user) return null

    // Verifica que el usuario sea miembro de la sala
    const { data, error } = await supabase
    .from("chat_room")
    .select("chat_id, name, chat_members!inner (FK_user_id)")
    .eq("chat_id", roomId)
    .eq("chat_members.FK_user_id", user.id)
    .single()

    if (error || !data) return null
    return { chat_id: data.chat_id, name: data.name }
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
    .select("id, content, created_at, content, FK_author_id, author:user_profile (username)")
    .eq("FK_chat_id", roomId)
    .order("created_at", {ascending: false})
    .limit(50)

    if(error || !data) return[]

    return data.map(msg => ({
        ...msg,
        author: Array.isArray(msg.author) ? (msg.author[0] ?? null) : msg.author
    })) as Message[]
}

//urgentemente hay que nuckear esto y usar el useTheme que no esta de adorno al menos con los colores
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
});
