import { useEffect, useState } from "react"
import { getLastGroupChat, saveLastGroupChat } from "@/src/storage"

export function useLastGroupChat(groupId: string) {
    const [lastChatId, setLastChatId] = useState<string | null>(null)

    useEffect(() => {
        getLastGroupChat(groupId).then(setLastChatId)
    }, [groupId])

    async function updateLastChat(chatId: string) {
        setLastChatId(chatId)
        await saveLastGroupChat(groupId, chatId)
    }

    return { lastChatId, updateLastChat }
}
