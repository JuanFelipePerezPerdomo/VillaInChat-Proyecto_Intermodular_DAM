import { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export function useCurrentUser(){

    const [ user, setUser ] = useState<User | null>(null);

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => setUser(data.user))

        const { data: { subscription  } } = supabase.auth.onAuthStateChange(
            (_, session) => setUser(session?.user ?? null)
        )
        return () => subscription.unsubscribe()
    }, [])

    return user;
}