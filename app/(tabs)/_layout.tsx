import { useTheme } from "@/src/hooks";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function RootLayout(){

    const { colors } = useTheme();

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
                    title: "Home",
                    tabBarIcon: ({ color }) => (
                        <MaterialCommunityIcons name="home" size={24} color={color}/>
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