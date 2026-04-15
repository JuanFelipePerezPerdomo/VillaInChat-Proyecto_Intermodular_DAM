import { useNotification } from "@/src/hooks/useNotification";
import { usePushToken } from "@/src/hooks/usePushToken";
import { useMentions } from "@/src/hooks/useMentions";
import { MentionWithDetails } from "@/src/types";
import { createContext, useContext } from "react";
import { useAuth } from "./AuthProvider";

type NotificationContextValue = {
    mentionUnreadCount: number
    mentions: MentionWithDetails[]
    refresh: () => void
    markAsRead: (mentionId: number) => Promise<void>
    markAllAsRead: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextValue>({
    mentionUnreadCount: 0,
    mentions: [],
    refresh: () => {},
    markAsRead: async () => {},
    markAllAsRead: async () => {},
})

export function useNotificationContext() {
    return useContext(NotificationContext)
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const { session } = useAuth();
    const userId = session?.user?.id ?? null;

    usePushToken(userId);
    useNotification();

    const { unreadCount, mentions, markAsRead, markAllAsRead, refresh } = useMentions(userId);

    return (
        <NotificationContext.Provider value={{
            mentionUnreadCount: unreadCount,
            mentions,
            refresh,
            markAsRead,
            markAllAsRead,
        }}>
            {children}
        </NotificationContext.Provider>
    );
}
