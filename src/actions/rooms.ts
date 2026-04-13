/*
A lo bien tengo una sensacion de que Actions es una carpeta inecesaria y esto deberia ir en otro lado
supongo que tendre que preguntarlo, tal vez soy demasiado paranoico con la estructuracion
no me gustaria que esto sea un codigo espagueti.....
*/
import z from "zod";
import { supabase } from "../lib/supabase";
import { createGroupSchema } from "../schemas/groupSchema";
import { createRoomSchema } from "../schemas/roomSchema";
import { getCurrentUser } from "../services";

export async function createRoom(unsafeData: z.infer<typeof createRoomSchema>) {
    const { success, data } = createRoomSchema.safeParse(unsafeData);

    if(!success) {
        return { error: true, message: "Invalid Room Data" }
    }

    const user = await getCurrentUser()
    if(user == null) {
        return { error: true, message: "User Not authenticated" }
    }

    const { data: room, error: roomError } = await supabase
    .from("chat_room")
    .insert({ name: data.name, chat_type: data.chatType })
    .select("chat_id")
    .single()

    console.log("room:", room);

    if ( roomError || room == null ) {
        return { error: true, message: "Failed to add user to room"}
    }

    const { error: membershipError } = await supabase
    .from("chat_members")
    .insert({ FK_chat_id: room.chat_id, FK_user_id: user.id})

    if(membershipError){
        console.error(membershipError)
        return { error: true, message: "Failed to add user to room" }
    }

    return { error: false, roomId: room.chat_id }
}   

export async function createGroup(
    unsafeData: z.infer<typeof createGroupSchema>,
    memberIds: string[] = []
) {
    const { success, data } = createGroupSchema.safeParse(unsafeData)
    if (!success) return { error: true, message: "Nombre de grupo inválido" }

    const user = await getCurrentUser()
    if (!user) return { error: true, message: "Usuario no autenticado" }

    const { data: group, error: groupError } = await supabase
        .from("group_room")
        .insert({ group_name: data.name })
        .select("group_id")
        .single()

    if (groupError || !group) return { error: true, message: "Error al crear el grupo" }

    const groupId = group.group_id
    const allMemberIds = [...new Set([...memberIds])] // excluye duplicados de invited

    const [chatsResult] = await Promise.all([
        supabase.from("chat_room").insert([
            { name: "General", chat_type: "PUBLIC",        FK_group_id: groupId },
            { name: "Avisos",  chat_type: "ANNOUNCEMENTS", FK_group_id: groupId },
        ]).select("chat_id"),
        // Insertar creador como ADMIN + miembros invitados como MEMBER
        supabase.from("group_members").insert([
            { FK_group_id: groupId, FK_user_id: user.id, user_role: "ADMIN" },
            ...allMemberIds.map((id) => ({ FK_group_id: groupId, FK_user_id: id, user_role: "MEMBER" as const })),
        ]),
    ])

    if (chatsResult.error || !chatsResult.data) return { error: true, message: "Error al crear los chats del grupo" }

    const chatIds = chatsResult.data.map((c) => c.chat_id)
    const allUserIds = [user.id, ...allMemberIds]

    const chatMemberInserts = allUserIds.flatMap((userId) =>
        chatIds.map((chatId) => ({ FK_chat_id: chatId, FK_user_id: userId }))
    )

    const { error: chatMemberError } = await supabase
        .from("chat_members")
        .insert(chatMemberInserts)

    if (chatMemberError) return { error: true, message: "Error al suscribir miembros a los chats" }

    return { error: false, groupId }
}

export async function findExistingDM(receiverId: string): Promise<string | null> {
    const user = await getCurrentUser()
    if (!user) return null

    // Solo DMs: PRIVATE sin grupo (FK_group_id IS NULL)
    const { data: myDMs } = await supabase
        .from("chat_members")
        .select("FK_chat_id, chat_room!inner(chat_type, FK_group_id)")
        .eq("FK_user_id", user.id)
        .eq("chat_room.chat_type", "PRIVATE")
        .is("chat_room.FK_group_id", null)

    const chatIds = myDMs?.map((c: any) => c.FK_chat_id) ?? []
    if (chatIds.length === 0) return null

    const { data: existing } = await supabase
        .from("chat_members")
        .select("FK_chat_id")
        .eq("FK_user_id", receiverId)
        .in("FK_chat_id", chatIds)
        .maybeSingle()

    return existing?.FK_chat_id ?? null
}

export async function createDM(receiverId: string, initialMessage: string) {
    const user = await getCurrentUser()
    if (!user) return { error: true, message: "No autenticado" }
    if (user.id === receiverId) return { error: true, message: "No puedes enviarte un DM a ti mismo" }

    // Check if a DM between these two users already exists (solo chats sin grupo)
    const { data: myPrivateChats } = await supabase
        .from("chat_members")
        .select("FK_chat_id, chat_room!inner(chat_type, FK_group_id)")
        .eq("FK_user_id", user.id)
        .eq("chat_room.chat_type", "PRIVATE")
        .is("chat_room.FK_group_id", null)

    const chatIds = myPrivateChats?.map((c: any) => c.FK_chat_id) ?? []

    if (chatIds.length > 0) {
        const { data: existing } = await supabase
            .from("chat_members")
            .select("FK_chat_id")
            .eq("FK_user_id", receiverId)
            .in("FK_chat_id", chatIds)
            .maybeSingle()

        if (existing) return { error: false, chatId: existing.FK_chat_id }
    }

    const { data: room, error: roomError } = await supabase
        .from("chat_room")
        .insert({ chat_type: "PRIVATE" })
        .select("chat_id")
        .single()

    if (roomError || !room) return { error: true, message: "Error al crear el chat" }

    const chatId = room.chat_id

    const { error: memberError } = await supabase
        .from("chat_members")
        .insert([
            { FK_chat_id: chatId, FK_user_id: user.id },
            { FK_chat_id: chatId, FK_user_id: receiverId },
        ])

    if (memberError) return { error: true, message: "Error al añadir miembros" }

    const { error: msgError } = await supabase
        .from("messages")
        .insert({
            content: initialMessage.trim(),
            FK_chat_id: chatId,
            FK_author_id: user.id,
            read: false,
        })

    if (msgError) return { error: true, message: "Error al enviar el mensaje inicial" }

    return { error: false, chatId }
}

export async function createGroupChat(
    groupId: string,
    name: string,
    chatType: "PRIVATE" | "PUBLIC" | "ANNOUNCEMENTS"
) {
    const user = await getCurrentUser()
    if (!user) return { error: true, message: "No autenticado" }

    const { data: room, error: roomError } = await supabase
        .from("chat_room")
        .insert({ name, chat_type: chatType, FK_group_id: groupId })
        .select("chat_id")
        .single()

    if (roomError || !room) return { error: true, message: "Error al crear el chat" }

    // El creador siempre entra al chat
    await supabase
        .from("chat_members")
        .insert({ FK_chat_id: room.chat_id, FK_user_id: user.id })

    // Si es público o avisos, suscribir a todos los miembros del grupo
    if (chatType !== "PRIVATE") {
        const { data: members } = await supabase
            .from("group_members")
            .select("FK_user_id")
            .eq("FK_group_id", groupId)
            .neq("FK_user_id", user.id)

        if (members && members.length > 0) {
            await supabase
                .from("chat_members")
                .insert(members.map(m => ({ FK_chat_id: room.chat_id, FK_user_id: m.FK_user_id })))
        }
    }

    return { error: false, chatId: room.chat_id }
}

export async function addChatMember(chatId: string, userId: string) {
    const { error } = await supabase
        .from("chat_members")
        .insert({ FK_chat_id: chatId, FK_user_id: userId })

    if (error) return { error: true, message: "Error al añadir miembro" }
    return { error: false }
}

export async function joinRoom(roomId:string) {
    const user = await getCurrentUser()
    if(!user) return { error: true, message: "Not Autenticated"}

    const { error } = await supabase
    .from("chat_members")
    .insert({ FK_chat_id: roomId, FK_user_id: user.id })

    if (error) return { error: true, message: "Failed to join room" }
    return { error: false }
}

export async function leaveRoom(roomId:string) {
    const user = await getCurrentUser()
    if (!user) return { error: true, message: "Not authenticated" }

    const { error } = await supabase
    .from("chat_members")
    .delete()
    .eq("FK_chat_id", roomId)
    .eq("FK_user_id", user.id)

    if (error) return { error: true, message: "Failed to leave room" }
    return { error: false }
}

export async function joinGroup(groupId: string) {
    const user = await getCurrentUser()
    if (!user) return { error: true, message: "Not authenticated" }

    const { error: memberError } = await supabase
        .from("group_members")
        .insert({ FK_group_id: groupId, FK_user_id: user.id })

    if (memberError) return { error: true, message: "Failed to join group" }

    const { data: chats, error: chatsError } = await supabase
        .from("chat_room")
        .select("chat_id")
        .eq("FK_group_id", groupId)

    if (chatsError || !chats) return { error: true, message: "Failed to fetch group chats" }

    if (chats.length > 0) {
        const { error: chatMemberError } = await supabase
            .from("chat_members")
            .insert(chats.map((chat) => ({ FK_chat_id: chat.chat_id, FK_user_id: user.id })))

        if (chatMemberError) return { error: true, message: "Failed to join group chats" }
    }

    return { error: false }
}

export async function leaveGroup(groupId: string) {
    const user = await getCurrentUser()
    if (!user) return { error: true, message: "Not authenticated" }

    const { data: chats, error: chatsError } = await supabase
        .from("chat_room")
        .select("chat_id")
        .eq("FK_group_id", groupId)

    if (chatsError) return { error: true, message: "Failed to fetch group chats" }

    const [groupResult, chatResult] = await Promise.all([
        supabase.from("group_members").delete()
            .eq("FK_group_id", groupId)
            .eq("FK_user_id", user.id),
        chats && chats.length > 0
            ? supabase.from("chat_members").delete()
                .in("FK_chat_id", chats.map(c => c.chat_id))
                .eq("FK_user_id", user.id)
            : Promise.resolve({ error: null }),
    ])

    if (groupResult.error || chatResult.error) return { error: true, message: "Failed to leave group" }
    return { error: false }
}

export async function inviteUserToGroup(groupId: string, userId: string) {
    const { error: memberError } = await supabase
        .from("group_members")
        .insert({ FK_group_id: groupId, FK_user_id: userId })

    if (memberError) return { error: true, message: "Failed to invite user" }

    // Subscribe to PUBLIC and ANNOUNCEMENTS chats only
    const { data: chats, error: chatsError } = await supabase
        .from("chat_room")
        .select("chat_id")
        .eq("FK_group_id", groupId)
        .in("chat_type", ["PUBLIC", "ANNOUNCEMENTS"])

    if (chatsError || !chats || chats.length === 0) return { error: false }

    const { error: chatMemberError } = await supabase
        .from("chat_members")
        .insert(chats.map((chat) => ({ FK_chat_id: chat.chat_id, FK_user_id: userId })))

    if (chatMemberError) return { error: true, message: "Failed to add user to group chats" }
    return { error: false }
}

