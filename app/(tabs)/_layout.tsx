import { useTheme } from "@/src/hooks";
import { useNotificationContext } from "@/src/providers/NotificationProvider";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function RootLayout(){

    const { colors } = useTheme();
    const { mentionUnreadCount } = useNotificationContext();

    return(
        <Tabs
        screenOptions={{
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: colors.icon,
            headerShown: false,
            tabBarStyle: {
                backgroundColor: colors.tabs,
                borderTopColor: colors.border,
            },
            headerStyle: {
                backgroundColor: colors.text,
            },
            headerTintColor: colors.text,
            headerShadowVisible: false,
        }}
        >
            <Tabs.Screen
                name="home"
                options={{
                    title: "Grupos",
                    tabBarIcon: ({ color }) => (
                        <MaterialCommunityIcons name="account-group" size={24} color={color}/>
                    )
                }}
            />
            <Tabs.Screen
                name="privateChatRooms"
                options={{
                    title: "Chats",
                    tabBarIcon: ({ color }) => (
                        <MaterialCommunityIcons name="chat" size={24} color={color}/>
                    )
                }}
            />
            <Tabs.Screen
                name="notifications"
                options={{
                    title: "Menciones",
                    tabBarBadge: mentionUnreadCount > 0 ? mentionUnreadCount : undefined,
                    tabBarIcon: ({ color }) => (
                        <MaterialCommunityIcons name="bell" size={24} color={color}/>
                    )
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: "Settings",
                    tabBarIcon: ({ color }) => (
                        <MaterialCommunityIcons name="cog" size={24} color={color}/>
                    )
                }}
            />
        </Tabs>
    )
}