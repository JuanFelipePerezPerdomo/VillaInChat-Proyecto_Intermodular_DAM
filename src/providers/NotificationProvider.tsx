import { useNotification } from "@/src/hooks/useNotification";
import { usePushToken } from "@/src/hooks/usePushToken";
import { useAuth } from "./AuthProvider";

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const { session } = useAuth();
    const userId = session?.user?.id ?? null;

    usePushToken(userId);
    useNotification();

    return <>{children}</>;
}
