import { useTheme } from "@/src/hooks"
import { supabase } from "@/src/lib/supabase"
import { getCurrentUser } from "@/src/services/getCurrentUser"
import { router, useLocalSearchParams, } from "expo-router"
import { useEffect, useState } from "react"
import { ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { FlatList, TextInput } from "react-native-gesture-handler"

type Room = {
    chat_id: string,
    name: string,
    FK_group_id: string | null,
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

export default function roomPage(){
    const { id } = useLocalSearchParams<{ id: string }>()
    const { colors } = useTheme()

    const [ room, setRoom ] = useState<Room | null>(null)
    const [ userProfile, setUserProfile ] = useState<UserProfile | null>(null)
    const [ message, setMessage ] = useState<Message[]>([])
    const [ newMessage, setNewMessage ] = useState("")
    const [ loading, setLoading ] = useState(true)
    const [ sending, setSending ] = useState(false)

    useEffect(() => {
        async function loadData() {
            const [roomData, profileData, messageData] = await Promise.all([
                getRoom(id),
                getUserProfile(),
                getMessage(id),
            ])

            //Si no existe el usuario o la sala forza el ir atras
            if (roomData == null || profileData == null) {
                router.replace("/home")
                return
            }

            setRoom(roomData)
            setUserProfile(profileData)
            setMessage(messageData)
            setLoading(false)
        }
        loadData()
    }, [])

    //Funciones en RealTime (intento 40)
    useEffect(() => {
        if (!id) return

        const channel = supabase
        .channel(`room:${id}`)
        .on(
            "postgres_changes",
            {
                event: "INSERT",
                schema: "public",
                table: "messages",
                filter: `FK_chat_id=eq.${id}`,
            },
            async (payload) => {
                // Hacemos un Fetch del autor del nuevo mensaje para tener el username
                const { data: author } = await supabase
                .from("user_profile")
                .select("username")
                .eq("user_id", payload.new.FK_author_id)
                .single()

                const newMsg: Message = {
                    id: payload.new.id,
                    created_at: payload.new.created_at,
                    content: payload.new.content,
                    FK_author_id: payload.new.FK_author_id,
                    author: author ?? null,
                }
                setMessage((prev) => [newMsg, ...prev])
            }
        )
        .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [id])

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

    if (loading) {
        return (
        <View style={styles.center}>
            <ActivityIndicator />
        </View>
        )
    }

    // Necesitamos un Input personalizado para el chat, el que ya tenemos tiene utilidades
    // mas genericas
    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: colors.background }]}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={90}
        >
            <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() =>
                    room?.FK_group_id
                        ? router.replace({ pathname: "/groups/[id]" as any, params: { id: room.FK_group_id } })
                        : router.replace("/(tabs)/privateChatRooms")
                }>
                    <Text style={[styles.backBtn, { color: colors.primary }]}> Volver</Text>
                </TouchableOpacity>
                <Text style={[styles.roomName, { color: colors.text }]}>{room?.name}</Text>
            </View>
            <FlatList
                data={message}
                keyExtractor={(item)=>item.id.toString()}
                inverted
                contentContainerStyle={styles.messagesList}
                renderItem={({ item }) => (
                    <MessageBubble
                        message={item}
                        isOwn={item.FK_author_id === userProfile?.user_id}
                    />
                )}
                ListEmptyComponent={
                    <View style={styles.emptyMessages}>
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No hay mensajes aun...</Text>
                    </View>
                }
            />
            <View style={[styles.inputRow, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>

                <TextInput
                    style={[styles.input, { backgroundColor: colors.surfaceVariant, color: colors.text }]}
                    value={newMessage}
                    onChangeText={setNewMessage}
                    placeholder="Escriba un Mensaje"
                    placeholderTextColor={colors.placeholder}
                    multiline
                    maxLength={500}
                />
                <TouchableOpacity
                    style={[styles.sendBtn, { backgroundColor: colors.primary }, (!newMessage.trim() || sending) && { backgroundColor: colors.primaryLight }]}
                    onPress={handleSend}
                    disabled={!newMessage.trim() || sending}
                >
                    <Text style={[styles.sendBtnText, { color: colors.textTertiary }]}>{sending ? "..." : "Enviar"}</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    )
}

// Para lo que estoy haciendo esto se queda aca, pero creo que si o si esto ira a componentes fijo
// Ojala adaptar todo esto sea sencillo...
function MessageBubble({message, isOwn}: { message: Message, isOwn: boolean }){
    const { colors } = useTheme()
    const time = new Date(message.created_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    })

    return(
        <View style={[styles.bubbleWrapper, isOwn ? styles.bubbleRight : styles.bubbleLeft]}>
            {!isOwn && (
                <Text style={[styles.bubbleAuthor, { color: colors.textSecondary }]}>{message.author?.username ?? "Desconocido"}</Text>
            )}
            <View style={[
                styles.bubble,
                isOwn
                    ? [styles.bubbleOwn, { backgroundColor: colors.primary }]
                    : [styles.bubbleOther, { backgroundColor: colors.surface, borderColor: colors.border }]
            ]}>
                <Text style={[styles.bubbleText, { color: isOwn ? colors.textTertiary : colors.text }]}>
                    {message.content}
                </Text>
            </View>
            <Text style={[styles.bubbleTime, { color: colors.textSecondary }, isOwn && { textAlign: "right" }]}>{time}</Text>
        </View>
    )
}

async function getRoom(roomId: string): Promise<Room | null> {
    const user = await getCurrentUser()
    if (!user) return null

    // Verifica que el usuario sea miembro de la sala
    const { data, error } = await supabase
    .from("chat_room")
    .select("chat_id, name, FK_group_id, chat_members!inner (FK_user_id)")
    .eq("chat_id", roomId)
    .eq("chat_members.FK_user_id", user.id)
    .single()

    if (error || !data) return null
    return { chat_id: data.chat_id, name: data.name, FK_group_id: data.FK_group_id ?? null }
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

const styles = StyleSheet.create({
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center"
    },
    container: {
        flex: 1,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        padding: 16,
        borderBottomWidth: 1,
    },
    backBtn: {
        fontSize: 15
    },
    roomName: {
        fontSize: 17,
        fontWeight: "600",
        flex: 1
    },
    messagesList: {
        padding: 16,
        gap: 8
    },
    emptyMessages: {
        flex: 1,
        alignItems: "center",
        marginTop: 40
    },
    emptyText: {
        fontSize: 14
    },
    bubbleWrapper: {
        marginBottom: 10,
        maxWidth: "75%"
    },
    bubbleLeft: {
        alignSelf: "flex-start"
    },
    bubbleRight: {
        alignSelf: "flex-end"
    },
    bubbleAuthor: {
        fontSize: 11,
        marginBottom: 2,
        marginLeft: 4
    },
    bubble: {
        borderRadius: 16,
        paddingVertical: 8,
        paddingHorizontal: 12
    },
    bubbleOwn: {
        borderBottomRightRadius: 4
    },
    bubbleOther: {
        borderBottomLeftRadius: 4,
        borderWidth: 1,
    },
    bubbleText: {
        fontSize: 14,
    },
    bubbleTime: {
        fontSize: 10,
        marginTop: 2,
        marginHorizontal: 4
    },
    inputRow: {
        flexDirection: "row",
        padding: 12,
        gap: 8,
        borderTopWidth: 1,
    },
    input: {
        flex: 1,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        fontSize: 14,
        maxHeight: 100
    },
    sendBtn: {
        borderRadius: 20,
        paddingHorizontal: 16,
        justifyContent: "center"
    },
    sendBtnText: {
        fontWeight: "600",
        fontSize: 14
    },
})
