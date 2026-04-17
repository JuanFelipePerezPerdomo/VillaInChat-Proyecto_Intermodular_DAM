import { useTheme } from "@/src/hooks"
import { BorderRadius, Spacing } from "@/src/themes"
import { Ionicons } from "@expo/vector-icons"
import { useRef, useState } from "react"
import {
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native"

export type ContextMenuItem = {
    label: string
    icon: keyof typeof Ionicons.glyphMap
    color?: string
    onPress: () => void
}

type Props = {
    items: ContextMenuItem[]
    children: React.ReactNode
}

type MenuPosition = { top: number; right: number }

export function ContextMenu({ items, children }: Props) {
    const { colors } = useTheme()
    const [visible, setVisible] = useState(false)
    const [position, setPosition] = useState<MenuPosition>({ top: 0, right: 16 })
    const triggerRef = useRef<View>(null)

    function openMenu() {
        triggerRef.current?.measureInWindow((x, y, width, height) => {
            setPosition({
                top: y + height + 4,
                right: 0, // se ajusta con "right" relativo a la pantalla
            })
            setVisible(true)
        })
    }

    return (
        <>
            <View ref={triggerRef}>
                <TouchableOpacity onPress={openMenu} hitSlop={8}>
                    {children}
                </TouchableOpacity>
            </View>

            <Modal
                visible={visible}
                transparent
                animationType="fade"
                statusBarTranslucent
                onRequestClose={() => setVisible(false)}
            >
                {/* Backdrop invisible — cierra al tocar fuera */}
                <TouchableOpacity
                    style={StyleSheet.absoluteFill}
                    activeOpacity={1}
                    onPress={() => setVisible(false)}
                />

                {/* Menú flotante posicionado junto al trigger */}
                <View
                    style={[
                        styles.menu,
                        {
                            backgroundColor: colors.card,
                            borderColor: colors.border,
                            top: position.top,
                            // Alineamos al borde derecho de la pantalla con margen
                            right: 16,
                        },
                    ]}
                >
                    {items.map((item, index) => (
                        <View key={item.label}>
                            {index > 0 && (
                                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                            )}
                            <TouchableOpacity
                                style={styles.item}
                                onPress={() => {
                                    setVisible(false)
                                    item.onPress()
                                }}
                                activeOpacity={0.7}
                            >
                                <Ionicons
                                    name={item.icon}
                                    size={17}
                                    color={item.color ?? colors.textSecondary}
                                />
                                <Text style={[styles.label, { color: item.color ?? colors.text }]}>
                                    {item.label}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
            </Modal>
        </>
    )
}

const styles = StyleSheet.create({
    menu: {
        position: "absolute",
        minWidth: 170,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
        elevation: 8,
        overflow: "hidden",
    },
    item: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.sm,
        paddingHorizontal: Spacing.lg,
        paddingVertical: 13,
    },
    label: {
        fontSize: 14,
        fontWeight: "500",
    },
    divider: {
        height: StyleSheet.hairlineWidth,
    },
})
