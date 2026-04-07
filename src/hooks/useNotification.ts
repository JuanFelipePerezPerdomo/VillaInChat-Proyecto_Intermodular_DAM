import * as Notification from "expo-notifications";
import { useRouter } from "expo-router";
import { useEffect } from "react";

export function useNotification () {
    const router = useRouter();

    useEffect(() => {
        // si el usuario toca la notificacion
        const sub = Notification.addNotificationResponseReceivedListener(response => {
            const { room_id } = response.notification.request.content.data;
            if (room_id) router.replace(`/rooms/${room_id}`)
        });

        return () => sub.remove();
    }, []);
}