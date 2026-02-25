import {
  Button, Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle
} from "@/src/components/ui";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

export default function Home() {
  return (
    <Empty>
      <EmptyHeader>
      <EmptyMedia variant="icon">
        <Ionicons name="chatbubble-outline" size={42}></Ionicons>
      </EmptyMedia>
      <EmptyTitle> No hay ningun chat creado </EmptyTitle>
      <EmptyDescription> Cree un nuevo chat</EmptyDescription>
      </EmptyHeader>

      <EmptyContent>
        <Button
          title="Crear un nuevo chat"
          onPress={() => router.push("/rooms/newRoomPage")}
        />
      </EmptyContent>
    </Empty>

    
  );
}
