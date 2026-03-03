import { supabase } from "../lib/supabase";

export async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    return user
}