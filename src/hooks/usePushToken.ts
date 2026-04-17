import Constants from "expo-constants";
import { useEffect } from "react";
import { getExpoPushToken } from "../lib/notifications";
import { supabase } from "../lib/supabase";

const isExpoGo = Constants.executionEnvironment === "storeClient";

export function usePushToken(userId: string | null) {
    useEffect(() => {
        if (!userId || isExpoGo) return;

        getExpoPushToken().then(async token => {
            if (!token) return;
            // Clear this token from any other user first (prevents duplicate-token notifications)
            await supabase
                .from('user_profile')
                .update({ push_token: null })
                .eq('push_token', token)
                .neq('user_id', userId)
            supabase
                .from('user_profile')
                .update({ push_token: token })
                .eq('user_id', userId)
                .then()
        });
    }, [userId]);
}