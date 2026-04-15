import { useCallback, useEffect, useRef, useState } from "react"
import { supabase } from "../lib/supabase"
import { getMentionsForUser, markAllMentionsAsRead, markMentionAsRead } from "../services/mentionServices"
import { MentionWithDetails } from "../types"

export function useMentions(userId: string | null) {
    const [mentions, setMentions] = useState<MentionWithDetails[]>([])
    // Track mounted state to avoid setState after unmount
    const mountedRef = useRef(true)
    // Track current userId for use inside async callbacks
    const userIdRef = useRef(userId)
    userIdRef.current = userId

    useEffect(() => {
        mountedRef.current = true
        return () => { mountedRef.current = false }
    }, [])

    useEffect(() => {
        if (!userId) {
            setMentions([])
            return
        }

        // Initial load
        getMentionsForUser(userId).then(data => {
            if (mountedRef.current) setMentions(data)
        })

        // Realtime: re-fetch when a new mention row is inserted
        const channel = supabase
            .channel(`useMentions:${userId}`)
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "mentions" },
                (payload) => {
                    const row = payload.new as any

                    // Quick client-side pre-filter before doing any async work
                    const isDirectMention = row.FK_recipent_id === userId
                    const isEveryone = row.type === "EVERYONE"
                    if (!isDirectMention && !isEveryone) return

                    // Re-fetch the full list (handles RLS for both USER and EVERYONE types)
                    const uid = userIdRef.current
                    if (!uid) return

                    getMentionsForUser(uid).then(data => {
                        if (mountedRef.current) setMentions(data)
                    })
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [userId])

    const unreadCount = mentions.filter(m => !m.read).length

    async function markAsRead(mentionId: number) {
        await markMentionAsRead(mentionId)
        setMentions(prev => prev.map(m => m.mention_id === mentionId ? { ...m, read: true } : m))
    }

    async function markAllAsRead() {
        if (!userId) return
        await markAllMentionsAsRead(userId)
        setMentions(prev => prev.map(m => ({ ...m, read: true })))
    }

    const refresh = useCallback(() => {
        const uid = userIdRef.current
        if (uid) {
            getMentionsForUser(uid).then(data => {
                if (mountedRef.current) setMentions(data)
            })
        }
    }, []) // stable — reads userId via ref, not closure

    return { mentions, unreadCount, markAsRead, markAllAsRead, refresh }
}
