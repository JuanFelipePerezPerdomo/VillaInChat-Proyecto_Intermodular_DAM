import { useEffect, useRef, useState } from "react"
import { searchUsersByUsername, UserSearchResult } from "../services/searchUsers"

export function useUserSearch(excludeId: string | null) {
    const [query, setQuery] = useState("")
    const [results, setResults] = useState<UserSearchResult[]>([])
    const [loading, setLoading] = useState(false)
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
        if (timerRef.current) clearTimeout(timerRef.current)

        if (!query.trim() || !excludeId) {
            setResults([])
            setLoading(false)
            return
        }

        setLoading(true)
        timerRef.current = setTimeout(async () => {
            const found = await searchUsersByUsername(query, excludeId)
            setResults(found)
            setLoading(false)
        }, 300)

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current)
        }
    }, [query, excludeId])

    function clearSearch() {
        setQuery("")
        setResults([])
    }

    return { query, setQuery, results, loading, clearSearch }
}
