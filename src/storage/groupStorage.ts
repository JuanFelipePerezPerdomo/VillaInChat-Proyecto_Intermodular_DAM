import AsyncStorage from "@react-native-async-storage/async-storage"

const KEY_PREFIX = "group_last_chat_"

export async function saveLastGroupChat(groupId: string, chatId: string): Promise<void> {
    await AsyncStorage.setItem(`${KEY_PREFIX}${groupId}`, chatId)
}

export async function getLastGroupChat(groupId: string): Promise<string | null> {
    return AsyncStorage.getItem(`${KEY_PREFIX}${groupId}`)
}
