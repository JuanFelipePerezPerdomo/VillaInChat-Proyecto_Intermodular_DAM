import { useTheme } from "@/src/hooks";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs as ExpoTabs } from "expo-router";

export default function Tabs(){

    const { colors } = useTheme();

    return(
        <ExpoTabs
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
            <ExpoTabs.Screen 
                name="home"
                options={{
                    title: "Home",
                    tabBarIcon: ({ color }) => (
                        <MaterialCommunityIcons name="home" size={24} color={color}/>
                    )
                }}
            />
            <ExpoTabs.Screen
                name="settings"
                options={{
                    title: "Settings",
                    tabBarIcon: ({ color }) => (
                        <MaterialCommunityIcons name="cog" size={24} color={color}/>
                    )
                }}
            />
        </ExpoTabs>
    )
}