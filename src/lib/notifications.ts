import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from 'expo-constants';
import * as Device from "expo-device";
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
        // Mentions always show regardless of the notifications_enabled preference
        const isMention = notification.request.content.data?.mention_type !== undefined;
        if (isMention) {
            return { shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: true, shouldShowBanner: true, shouldShowList: true };
        }
        const stored = await AsyncStorage.getItem("notifications_enabled");
        const enabled = stored !== "false";
        return {
            shouldShowAlert: enabled,
            shouldPlaySound: enabled,
            shouldSetBadge: enabled,
            shouldShowBanner: enabled,
            shouldShowList: enabled,
        };
    },
});

export async function getExpoPushToken(): Promise<string | null> {
    if (!Device.isDevice) return null;

    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return null;

    try {
        const projectId = Constants.expoConfig?.extra?.eas?.projectId;
        const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
        return data;
    } catch {
        return null;
    }
}