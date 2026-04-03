import { BottomSheetModalProvider } from "@gorhom/bottom-sheet"
import { createContext, useContext, useRef, useState } from "react"
import { SheetUser, UserBottomSheet } from "@/src/components/users/UserBottomSheet"

type UserSheetContextType = {
    openUserSheet: (user: SheetUser) => void
}

const UserSheetContext = createContext<UserSheetContextType | null>(null)

export function UserSheetProvider({ children }: { children: React.ReactNode }) {
    const sheetRef = useRef<any>(null)
    const [selectedUser, setSelectedUser] = useState<SheetUser | null>(null)

    function openUserSheet(user: SheetUser) {
        setSelectedUser(user)
        sheetRef.current?.present()
    }

    return (
        <UserSheetContext.Provider value={{ openUserSheet }}>
            <BottomSheetModalProvider>
                {children}
                <UserBottomSheet ref={sheetRef} user={selectedUser} />
            </BottomSheetModalProvider>
        </UserSheetContext.Provider>
    )
}

export function useUserSheet() {
    const ctx = useContext(UserSheetContext)
    if (!ctx) throw new Error("useUserSheet debe usarse dentro de UserSheetProvider")
    return ctx
}
