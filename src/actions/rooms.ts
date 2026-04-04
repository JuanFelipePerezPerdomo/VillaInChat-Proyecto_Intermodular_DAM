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

