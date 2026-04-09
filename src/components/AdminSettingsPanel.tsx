import { useTheme } from "@/src/hooks";
import { useSettingsStore } from "@/src/stores";
import type { ThemeMode } from "@/src/types";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type SettingsOption = {
    key: string;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
};

const SETTINGS_OPTIONS: SettingsOption[] = [
    { key: "temas", label: "Temas", icon: "color-palette-outline" },
    { key: "cuenta", label: "Cuenta", icon: "person-outline" },
    { key: "notificaciones", label: "Notificaciones", icon: "notifications-outline" },
];

const THEME_CHOICES: { value: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { value: "light", label: "Claro", icon: "sunny-outline" },
    { value: "dark", label: "Oscuro", icon: "moon-outline" },
];

export default function AdminSettingsPanel() {
    const { colors } = useTheme();
    const { theme, setTheme } = useSettingsStore();
    const [expandedKey, setExpandedKey] = useState<string | null>(null);

    function handlePress(key: string) {
        setExpandedKey(expandedKey === key ? null : key);
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {SETTINGS_OPTIONS.map((option, index) => (
                <View key={option.key}>
                    <TouchableOpacity
                        style={[
                            styles.row,
                            index < SETTINGS_OPTIONS.length - 1 && expandedKey !== option.key && {
                                borderBottomWidth: 1,
                                borderBottomColor: colors.divider,
                            },
                        ]}
                        onPress={() => handlePress(option.key)}
                        activeOpacity={0.6}
                    >
                        <View style={styles.rowLeft}>
                            <Ionicons name={option.icon} size={20} color={colors.onPrimary} />
                            <Text style={[styles.label, { color: colors.onPrimary }]}>{option.label}</Text>
                        </View>
                        <Ionicons
                            name={expandedKey === option.key ? "chevron-down" : "chevron-forward"}
                            size={20}
                            color={colors.onPrimary}
                        />
                    </TouchableOpacity>

                    {expandedKey === option.key && (
                        <View style={[styles.expandedContent, { backgroundColor: colors.surfaceVariant }]}>
                            {option.key === "temas" ? (
                                THEME_CHOICES.map((choice) => (
                                    <TouchableOpacity
                                        key={choice.value}
                                        style={styles.themeRow}
                                        onPress={() => setTheme(choice.value)}
                                        activeOpacity={0.6}
                                    >
                                        <View style={styles.rowLeft}>
                                            <Ionicons name={choice.icon} size={18} color={colors.onPrimary} />
                                            <Text style={[styles.themeLabel, { color: colors.onPrimary }]}>{choice.label}</Text>
                                        </View>
                                        <View style={[styles.radio, { borderColor: theme === choice.value ? colors.primary : colors.border }]}>
                                            {theme === choice.value && (
                                                <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />
                                            )}
                                        </View>
                                    </TouchableOpacity>
                                ))
                            ) : (
                                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                                    Sin contenido
                                </Text>
                            )}
                            {index < SETTINGS_OPTIONS.length - 1 && (
                                <View style={{ borderBottomWidth: 1, borderBottomColor: colors.divider }} />
                            )}
                        </View>
                    )}
                </View>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 12,
        overflow: "hidden",
        marginBottom: 8,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 14,
        paddingHorizontal: 16,
    },
    rowLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    label: {
        fontSize: 16,
        fontWeight: "500",
    },
    expandedContent: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    themeRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 10,
        paddingLeft: 32,
    },
    themeLabel: {
        fontSize: 14,
        fontWeight: "400",
    },
    emptyText: {
        fontSize: 13,
        fontStyle: "italic",
        paddingVertical: 10,
        paddingLeft: 32,
    },
    radio: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        justifyContent: "center",
        alignItems: "center",
    },
    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
});
