import { supabase } from "../lib/supabase";
import { MentionWithDetails } from "../types";

// ─── Parse ────────────────────────────────────────────────────────────────────

export type ParsedMention = {
    type: "USER" | "EVERYONE"
    recipientId: string | null
}

/**
 * Scans message content for @everyone and @username patterns.
 * Returns one entry per unique mention found.
 */
export function parseMentions(
    content: string,
    chatMembers: { user_id: string; username: string }[]
): ParsedMention[] {
    const results: ParsedMention[] = []

    if (content.includes("@everyone")) {
        results.push({ type: "EVERYONE", recipientId: null })
    }

    for (const member of chatMembers) {
        // Match @username followed by space, end-of-string, or punctuation
        const pattern = new RegExp(`@${escapeRegex(member.username)}(?=\\s|$|[^\\w])`)
        if (pattern.test(content)) {
            // Avoid duplicate entries for the same user
            if (!results.some(r => r.type === "USER" && r.recipientId === member.user_id)) {
                results.push({ type: "USER", recipientId: member.user_id })
            }
        }
    }

    return results
}

function escapeRegex(str: string) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

// ─── Insert ───────────────────────────────────────────────────────────────────

/**
 * Inserts mention rows into the `mentions` table after a message is sent.
 */
export async function insertMentions(
    messageId: number,
    chatId: string,
    senderId: string,
    mentions: ParsedMention[]
): Promise<void> {
    if (mentions.length === 0) return

    const rows = mentions.map(m => ({
        FK_message_id: messageId,
        FK_chat_id: chatId,
        FK_sender_id: senderId,
        FK_recipent_id: m.recipientId,
        type: m.type,
        read: false,
    }))

    const { error } = await supabase.from("mentions").insert(rows)
    if (error) console.error("[mentions] insertMentions error:", error)
}

// ─── Query ────────────────────────────────────────────────────────────────────

/**
 * Fetches all mentions for a user:
 * - Direct mentions (FK_recipent_id = userId)
 * - @everyone mentions in chats the user belongs to
 */
const MENTION_SELECT = `
    mention_id,
    type,
    read,
    created_at,
    FK_chat_id,
    FK_message_id,
    FK_sender_id,
    FK_recipent_id,
    sender:user_profile!FK_sender_id (username),
    chat:chat_room!FK_chat_id (name),
    message:messages!FK_message_id (content)
`

function normalizeRow(row: any): MentionWithDetails {
    return {
        ...row,
        sender:  Array.isArray(row.sender)  ? (row.sender[0]  ?? { username: "?" }) : (row.sender  ?? { username: "?" }),
        chat:    Array.isArray(row.chat)    ? (row.chat[0]    ?? { name: null })     : (row.chat    ?? { name: null }),
        message: Array.isArray(row.message) ? (row.message[0] ?? { content: "" })   : (row.message ?? { content: "" }),
    } as MentionWithDetails
}

export async function getMentionsForUser(userId: string): Promise<MentionWithDetails[]> {
    // Fetch the user's chat memberships
    const { data: memberRows } = await supabase
        .from("chat_members")
        .select("FK_chat_id")
        .eq("FK_user_id", userId)

    const chatIds = (memberRows ?? []).map(r => r.FK_chat_id)

    // Two separate queries to avoid complex nested OR syntax
    const [directRes, everyoneRes] = await Promise.all([
        // 1. Direct USER mentions addressed to this user
        supabase
            .from("mentions")
            .select(MENTION_SELECT)
            .eq("FK_recipent_id", userId)
            .order("created_at", { ascending: false })
            .limit(50),

        // 2. @everyone mentions in chats the user belongs to
        chatIds.length > 0
            ? supabase
                .from("mentions")
                .select(MENTION_SELECT)
                .eq("type", "EVERYONE")
                .in("FK_chat_id", chatIds)
                .order("created_at", { ascending: false })
                .limit(50)
            : Promise.resolve({ data: [], error: null }),
    ])

    if (directRes.error) console.error("[mentions] direct query error:", directRes.error)
    if (everyoneRes.error) console.error("[mentions] everyone query error:", everyoneRes.error)

    console.log("[mentions] direct:", directRes.data?.length ?? 0, "everyone:", everyoneRes.data?.length ?? 0, "chatIds:", chatIds.length)

    const direct   = (directRes.data   ?? []).map(normalizeRow)
    const everyone = (everyoneRes.data ?? []).map(normalizeRow)

    // Merge + sort by date descending, deduplicate by mention_id
    const seen = new Set<number>()
    const merged = [...direct, ...everyone]
        .filter(m => { if (seen.has(m.mention_id)) return false; seen.add(m.mention_id); return true })
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 60)

    return merged
}

// ─── Mark read ────────────────────────────────────────────────────────────────

export async function markMentionAsRead(mentionId: number): Promise<void> {
    const { error } = await supabase
        .from("mentions")
        .update({ read: true })
        .eq("mention_id", mentionId)
    if (error) console.error("[mentions] markMentionAsRead error:", error)
}

export async function markAllMentionsAsRead(userId: string): Promise<void> {
    // Get the user's chat ids to scope the @everyone updates
    const { data: memberRows } = await supabase
        .from("chat_members")
        .select("FK_chat_id")
        .eq("FK_user_id", userId)

    const chatIds = (memberRows ?? []).map(r => r.FK_chat_id)

    const [directRes, everyoneRes] = await Promise.all([
        // Direct USER mentions
        supabase
            .from("mentions")
            .update({ read: true })
            .eq("FK_recipent_id", userId)
            .eq("read", false),

        // @everyone mentions in the user's chats
        chatIds.length > 0
            ? supabase
                .from("mentions")
                .update({ read: true })
                .eq("type", "EVERYONE")
                .in("FK_chat_id", chatIds)
                .eq("read", false)
            : Promise.resolve({ error: null }),
    ])

    if (directRes.error)   console.error("[mentions] markAllRead direct error:", directRes.error)
    if (everyoneRes.error) console.error("[mentions] markAllRead everyone error:", everyoneRes.error)
}
