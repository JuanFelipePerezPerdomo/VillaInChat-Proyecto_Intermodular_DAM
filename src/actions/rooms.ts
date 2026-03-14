/*
A lo bien tengo una sensacion de que Actions es una carpeta inecesaria y esto deberia ir en otro lado
supongo que tendre que preguntarlo, tal vez soy demasiado paranoico con la estructuracion
no me gustaria que esto sea un codigo espagueti.....
*/
import z from "zod";
import { supabase } from "../lib/supabase";
import { createRoomSchema } from "../schemas/roomSchema";
import { getCurrentUser } from "../services/getCurrentUser";

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
    .insert({ name: data.name, is_public: data.isPublic})
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