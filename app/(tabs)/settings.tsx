import { Button, Card } from "@/src/components/ui";
import { useTheme } from "@/src/hooks";
import { supabase } from "@/src/lib/supabase";
import { getCurrentUser } from "@/src/services/getCurrentUser";
import { useSettingsStore } from "@/src/stores";
import { Spacing, Typography } from "@/src/themes";
import type { ThemeMode } from "@/src/types";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { LayoutChangeEvent, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import Animated, { useAnimatedStyle, withTiming } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: string }[] = [
    { value: "light",  label: "Claro",   icon: "sunny-outline" },
    { value: "dark",   label: "Oscuro",  icon: "moon-outline" },
    { value: "system", label: "Sistema", icon: "phone-portrait-outline" },
];

const SETTINGS_SECTIONS = [
    { key: "tema",          label: "Tema",           icon: "color-palette-outline" },
    { key: "notificaciones",label: "Notificaciones", icon: "notifications-outline" },
    { key: "cuenta",        label: "Cuenta",         icon: "person-outline" },
];

// ─── Accordion section con animación ─────────────────────────────────────────

function AccordionSection({
    section,
    isExpanded,
    isLast,
    onPress,
    children,
}: {
    section: typeof SETTINGS_SECTIONS[number]
    isExpanded: boolean
    isLast: boolean
    onPress: () => void
    children: React.ReactNode
}) {
    const { colors } = useTheme()
    const measuredRef = useRef(0)

    const animatedStyle = useAnimatedStyle(() => ({
        height:   withTiming(isExpanded ? measuredRef.current : 0, { duration: 250 }),
        opacity:  withTiming(isExpanded ? 1 : 0,                   { duration: 200 }),
        overflow: "hidden",
    }))

    const chevronStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: withTiming(isExpanded ? "90deg" : "0deg", { duration: 250 }) }],
    }))

    function onContentLayout(e: LayoutChangeEvent) {
        const h = e.nativeEvent.layout.height
        if (h > 0 && measuredRef.current === 0) {
            measuredRef.current = h
        }
    }

    return (
        <View>
            <TouchableOpacity
                style={[
                    styles.accordionHeader,
                    !isLast && !isExpanded && { borderBottomWidth: 1, borderBottomColor: colors.border },
                ]}
                onPress={onPress}
                activeOpacity={0.7}
            >
                <View style={styles.accordionHeaderLeft}>
                    <Ionicons name={section.icon as any} size={22} color={colors.icon} />
                    <Text style={[styles.accordionTitle, { color: colors.text }]}>{section.label}</Text>
                </View>
                <Animated.View style={chevronStyle}>
                    <Ionicons name="chevron-forward" size={20} color={colors.icon} />
                </Animated.View>
            </TouchableOpacity>

            <Animated.View style={animatedStyle}>
                {/* Vista oculta para medir la altura real del contenido */}
                <View
                    style={styles.measureContainer}
                    onLayout={onContentLayout}
                    pointerEvents="none"
                >
                    {children}
                </View>
                {/* Vista visible */}
                <View style={[
                    styles.accordionContent,
                    !isLast && isExpanded && { borderBottomWidth: 1, borderBottomColor: colors.border },
                ]}>
                    {children}
                </View>
            </Animated.View>
        </View>
    )
}

// ─── Pantalla principal ───────────────────────────────────────────────────────

export default function Settings() {
    const { colors } = useTheme();
    const { theme, setTheme } = useSettingsStore();
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [expandedSection, setExpandedSection] = useState<string | null>(null);

    useEffect(() => {
        async function loadNotificationSetting() {
            const user = await getCurrentUser();
            if (!user) return;
            const { data } = await supabase
                .from("user_profile")
                .select("notifications_enabled")
                .eq("user_id", user.id)
                .single();
            if (data) setNotificationsEnabled(data.notifications_enabled ?? true);
        }
        loadNotificationSetting();
    }, []);

    async function handleToggleNotifications(value: boolean) {
        setNotificationsEnabled(value);
        const user = await getCurrentUser();
        if (!user) return;
        await supabase
            .from("user_profile")
            .update({ notifications_enabled: value })
            .eq("user_id", user.id);
    }

    async function handleLogout() {
        await supabase.auth.signOut();
    }

    function handlePressSection(key: string) {
        setExpandedSection(prev => prev === key ? null : key);
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <Card style={styles.cardContainer}>
                {SETTINGS_SECTIONS.map((section, index) => {
                    const isLast     = index === SETTINGS_SECTIONS.length - 1
                    const isExpanded = expandedSection === section.key

                    return (
                        <AccordionSection
                            key={section.key}
                            section={section}
                            isExpanded={isExpanded}
                            isLast={isLast}
                            onPress={() => handlePressSection(section.key)}
                        >
                            {section.key === "tema" && (
                                <>
                                    {THEME_OPTIONS.map(option => (
                                        <TouchableOpacity
                                            key={option.value}
                                            style={styles.optionRow}
                                            onPress={() => setTheme(option.value)}
                                            activeOpacity={0.7}
                                        >
                                            <View style={styles.optionInfo}>
                                                <Ionicons name={option.icon as any} size={20} color={colors.icon} />
                                                <Text style={[styles.optionLabel, { color: colors.text }]}>
                                                    {option.label}
                                                </Text>
                                            </View>
                                            <View style={[styles.radio, {
                                                borderColor: theme === option.value ? colors.primary : colors.border,
                                            }]}>
                                                {theme === option.value && (
                                                    <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />
                                                )}
                                            </View>
                                        </TouchableOpacity>
                                    ))}
                                </>
                            )}

                            {section.key === "notificaciones" && (
                                <View style={styles.optionRow}>
                                    <View style={styles.optionInfo}>
                                        <Ionicons
                                            name={notificationsEnabled ? "notifications-outline" : "notifications-off-outline"}
                                            size={20}
                                            color={colors.icon}
                                        />
                                        <Text style={[styles.optionLabel, { color: colors.text }]}>
                                            Habilitar Notificaciones
                                        </Text>
                                    </View>
                                    <Switch
                                        value={notificationsEnabled}
                                        onValueChange={handleToggleNotifications}
                                        trackColor={{ false: colors.border, true: colors.primary }}
                                        thumbColor="#fff"
                                    />
                                </View>
                            )}

                            {section.key === "cuenta" && (
                                <View style={styles.optionContent}>
                                    <Button
                                        title="Cerrar Sesion"
                                        onPress={handleLogout}
                                        variant="primary"
                                        fullWidth
                                    />
                                </View>
                            )}
                        </AccordionSection>
                    )
                })}
            </Card>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: Spacing.xl,
    },
    cardContainer: {
        padding: 0,
        overflow: "hidden",
    },
    accordionHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: Spacing.lg,
        paddingHorizontal: Spacing.lg,
    },
    accordionHeaderLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.md,
    },
    accordionTitle: {
        ...Typography.body,
        fontWeight: "600",
    },
    measureContainer: {
        position: "absolute",
        opacity: 0,
        pointerEvents: "none",
        width: "100%",
    },
    accordionContent: {
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.lg,
        paddingTop: Spacing.sm,
    },
    optionRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: Spacing.md,
    },
    optionInfo: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.md,
        paddingLeft: Spacing.lg,
    },
    optionLabel: {
        ...Typography.body,
    },
    optionContent: {
        paddingVertical: Spacing.sm,
        paddingTop: Spacing.md,
    },
    radio: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        justifyContent: "center",
        alignItems: "center",
    },
    radioInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
});
