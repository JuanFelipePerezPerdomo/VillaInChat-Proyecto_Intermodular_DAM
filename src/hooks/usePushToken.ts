import Constants from "expo-constants";
import { useEffect } from "react";
import { getExpoPushToken } from "../lib/notifications";
import { supabase } from "../lib/supabase";

const isExpoGo = Constants.executionEnvironment === "storeClient";

export function usePushToken(userId: string | null) {
    useEffect(() => {
        if (!userId || isExpoGo) return;

        getExpoPushToken().then(token => {
            if (!token) return;
            supabase
                .from('user_profile')
                .update({ push_token: token })
                .eq('user_id', userId)
                .then()
        });
    }, [userId]);
}