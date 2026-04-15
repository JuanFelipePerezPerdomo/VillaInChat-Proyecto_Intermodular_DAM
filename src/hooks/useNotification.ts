import * as Notification from "expo-notifications";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MENTIONS_TEACHERS_ONLY_KEY } from "../constants/notificationSettings";

export function useNotification () {
    const router = useRouter();

    useEffect(() => {
        Notification.setNotificationHandler({
            handleNotification: async (notification) => {
                const onlyAdminMentions = (await AsyncStorage.getItem(MENTIONS_TEACHERS_ONLY_KEY)) === "true";
                const authorRole = String(notification.request.content.data?.author_role ?? "");

                if (onlyAdminMentions && authorRole !== "ADMIN") {
                    return {
                        shouldShowAlert: false,
                        shouldPlaySound: false,
                        shouldSetBadge: false,
                        shouldShowBanner: false,
                        shouldShowList: false,
                    };
                }

                return {
                    shouldShowAlert: true,
                    shouldPlaySound: true,
                    shouldSetBadge: false,
                    shouldShowBanner: true,
                    shouldShowList: true,
                };
            },
        });

        // si el usuario toca la notificacion
        const sub = Notification.addNotificationResponseReceivedListener(response => {
            const { room_id } = response.notification.request.content.data;
            if (room_id) router.push(`/rooms/${room_id}`)
        });

        return () => sub.remove();
    }, []);
}