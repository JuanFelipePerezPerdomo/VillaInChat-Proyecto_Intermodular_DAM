import { useEffect, useRef, useState } from "react"
import { UserSearchResult } from "../services/searchUsers"

// Filtra localmente la lista de miembros del grupo ya cargada — sin llamadas a API.
export function useGroupMemberSearch(members: UserSearchResult[]) {
    const [query, setQuery]     = useState("")
    const [results, setResults] = useState<UserSearchResult[]>([])
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
        if (timerRef.current) clearTimeout(timerRef.current)

        if (!query.trim()) {
            setResults([])
            return
        }

        timerRef.current = setTimeout(() => {
            const lower = query.toLowerCase()
            setResults(members.filter(m => m.username.toLowerCase().includes(lower)))
        }, 150)

        return () => { if (timerRef.current) clearTimeout(timerRef.current) }
    }, [query, members])

    function clearSearch() {
        setQuery("")
        setResults([])
    }

    return { query, setQuery, results, clearSearch }
}
