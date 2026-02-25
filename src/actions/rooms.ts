// import { Redirect } from "expo-router";
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
    .select("id")
    .single()

    if ( roomError || room == null ) {
        return { error: true, message: "Failed to add user to room"}
    }

    const { error: membershipError } = await supabase
    .from("chat_members")
    .insert({ FK_chat_id: room.id, FK_user_id: user.id})

    if(membershipError){
        console.error(membershipError)
        return { error: true, message: "Failed to add user to room" }
    }

    return { error: false, roomId: room.id }
}   