import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import AuthProvider from "@/src/providers";

export default function RootLayout() {
  return (
    <AuthProvider>
      <GestureHandlerRootView>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index"/>
          <Stack.Screen name="(auth)/SignIn"/>
          <Stack.Screen name="(auth)/SignUp"/>
          <Stack.Screen name="rooms/NewRoomPage"/>
          <Stack.Screen name="rooms/[id]"/>
        </Stack>
      </GestureHandlerRootView>
    </AuthProvider>
  );
}
