import { BottomSheetModalProvider } from "@gorhom/bottom-sheet"
import { createContext, useContext, useRef, useState } from "react"
import { SheetUser, UserBottomSheet } from "@/src/components/users/UserBottomSheet"
import { supabase } from "@/src/lib/supabase"

type UserSheetContextType = {
    openUserSheet: (user: SheetUser) => void
    closeUserSheet: () => void
}

const UserSheetContext = createContext<UserSheetContextType | null>(null)

export function UserSheetProvider({ children }: { children: React.ReactNode }) {
    const sheetRef = useRef<any>(null)
    const [selectedUser, setSelectedUser] = useState<SheetUser | null>(null)

    function openUserSheet(user: SheetUser) {
        setSelectedUser(user)
        sheetRef.current?.present()

        void (async () => {
            const { data } = await supabase
                .from("user_profile")
                .select("grade")
                .eq("user_id", user.user_id)
                .single()

            setSelectedUser((prev) => {
                if (!prev || prev.user_id !== user.user_id) return prev
                return { ...prev, course: data?.grade ?? "" }
            })
        })()
    }

    function closeUserSheet() {
        sheetRef.current?.dismiss()
    }

    return (
        <UserSheetContext.Provider value={{ openUserSheet, closeUserSheet }}>
            <BottomSheetModalProvider>
                {children}
                <UserBottomSheet ref={sheetRef} user={selectedUser} onClose={closeUserSheet} />
            </BottomSheetModalProvider>
        </UserSheetContext.Provider>
    )
}

export function useUserSheet() {
    const ctx = useContext(UserSheetContext)
    if (!ctx) throw new Error("useUserSheet debe usarse dentro de UserSheetProvider")
    return ctx
}
