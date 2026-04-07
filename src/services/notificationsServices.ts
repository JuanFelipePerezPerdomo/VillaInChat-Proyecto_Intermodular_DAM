import { supabase } from "../lib/supabase";

export async function sendPushNotification ({
    senderId,
    receiverId,
    message,
    roomId,
}: {
    senderId: string;
    receiverId: string;
    message: string;
    roomId: string;
}) {
    await supabase.functions.invoke('send-push', {
        body: { sender_id: senderId, receiver_id: receiverId, message, room_id: roomId }
    }); 
}