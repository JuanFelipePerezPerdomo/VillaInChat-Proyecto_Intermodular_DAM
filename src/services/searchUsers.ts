import { supabase } from "../lib/supabase";

export type UserSearchResult = {
    user_id: string
    username: string
}

export async function searchUsersByUsername(
    query: string,
    excludeId: string
): Promise<UserSearchResult[]> {
    if (!query.trim()) return []

    const { data, error } = await supabase
        .from("user_profile")
        .select("user_id, username")
        .ilike("username", `%${query.trim()}%`)
        .neq("user_id", excludeId)
        .limit(8)

    if (error || !data) return []
    return data
}
