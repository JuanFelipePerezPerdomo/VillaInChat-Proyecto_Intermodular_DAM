import { useTheme } from "@/src/hooks";
import AuthProvider, { NotificationProvider } from "@/src/providers";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";

function RootNavigator() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: "fade",
      }}
    >
      <Stack.Screen name="index"/>
      <Stack.Screen name="(auth)/SignIn"/>
      <Stack.Screen name="(auth)/SignUp"/>
      <Stack.Screen name="rooms/newRoomPage"/>
      <Stack.Screen name="rooms/[id]"/>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <RootNavigator />
        </GestureHandlerRootView>
      </NotificationProvider>
    </AuthProvider>
  );
}
