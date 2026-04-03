import { Button, Card } from "@/src/components/ui";
import { useTheme } from "@/src/hooks";
import { supabase } from "@/src/lib/supabase";
import { useSettingsStore } from "@/src/stores";
import { Spacing, Typography } from "@/src/themes";
import type { ThemeMode } from "@/src/types";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: string }[] = [
    {value: "light", label: "Claro", icon:"sunny-outline"},
    {value: "dark", label: "Oscuro", icon:"moon-outline"},
    {value: "system", label: "Sistema", icon:"phone-portrait-outline"},
];

export default function Settings() {

    const { colors, isDark } = useTheme();

    const {
        theme,
        welcomeShown,
        setTheme,
        setWelcomeShown,
    } = useSettingsStore();

    async function handleLogout() {
        await supabase.auth.signOut();
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <Card style={styles.section}>
                <Text style={[styles.sectionTitle, {color: colors.text}]}> Tema </Text>

                {THEME_OPTIONS.map((option) => (
                    <TouchableOpacity
                        key={option.value}
                        style={styles.optionInfo}
                        onPress={() => setTheme(option.value)}
                    >
                        <View style={styles.optionInfo}>
                            <Ionicons
                                name={option.icon as any}
                                size={20}
                                color={colors.icon}
                            />
                            <Text style={[styles.optionLabel, { color: colors.text}]}>
                                {option.label}
                            </Text>
                        </View>
                        <View
                            style={[styles.radio,
                                {
                                    borderColor:
                                        theme === option.value ? colors.primary : colors.border
                                },
                            ]}
                        >
                            {theme === option.value && (
                                <View
                                    style={[
                                        styles.radioInner,
                                        { backgroundColor: colors.primary },
                                    ]}
                                />
                            )}
                        </View>
                    </TouchableOpacity>
                ))}
                

            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Cuenta</Text>
                <Button
                    title="Cerrar Sesion"
                    onPress={handleLogout}
                    variant="outline"
                    fullWidth
                />
            </View>
            </Card>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: Spacing.xl,
    },
    title: {
        ...Typography.h2,
        marginBottom: Spacing.xxl,
    },
    section: {
        gap: Spacing.sm,
        marginBottom: Spacing.xl,
    },
    sectionTitle: {
        ...Typography.label,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    card: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: Spacing.lg,
        borderRadius: 12,
        borderWidth: 1,
    },
    cardText: {
        ...Typography.body,
    },
    cardValue: {
        ...Typography.bodySmall,
    },
    optionRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: Spacing.sm,
    },
    optionInfo: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.md,
    },
    optionLabel: {
        ...Typography.body,
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
