import { Button, Card } from "@/src/components/ui";
import { useTheme } from "@/src/hooks";
import { supabase } from "@/src/lib/supabase";
import { getCurrentUser } from "@/src/services/getCurrentUser";
import { useSettingsStore } from "@/src/stores";
import { MENTIONS_TEACHERS_ONLY_KEY } from "@/src/constants/notificationSettings";
import { Spacing, Typography } from "@/src/themes";
import type { ThemeMode } from "@/src/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Alert, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: string }[] = [
    { value: "light", label: "Claro", icon: "sunny-outline" },
    { value: "dark", label: "Oscuro", icon: "moon-outline" },
    { value: "system", label: "Sistema", icon: "phone-portrait-outline" },
];

const SETTINGS_SECTIONS = [
    { key: "tema", label: "Tema", icon: "color-palette-outline" },
    { key: "notificaciones", label: "Notificaciones", icon: "notifications-outline" },
    { key: "cuenta", label: "Cuenta", icon: "person-outline" },
];

export default function Settings() {
    const { colors } = useTheme();
    const { theme, setTheme } = useSettingsStore();
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [mentionsTeachersOnly, setMentionsTeachersOnly] = useState(false);
    const [grade, setGrade] = useState("");
    const [draftGrade, setDraftGrade] = useState("");
    const [editingGrade, setEditingGrade] = useState(false);
    const [savingGrade, setSavingGrade] = useState(false);
    const [expandedSection, setExpandedSection] = useState<string | null>(null);

    useEffect(() => {
        async function loadSettingsData() {
            const user = await getCurrentUser();
            if (!user) return;
            const { data } = await supabase
                .from("user_profile")
                .select("notifications_enabled, grade")
                .eq("user_id", user.id)
                .single();
            if (data) {
                setNotificationsEnabled(data.notifications_enabled ?? true);
                setGrade(data.grade ?? "");
                setDraftGrade(data.grade ?? "");
            }
        }
        loadSettingsData();
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

    async function handleToggleTeacherMentions(value: boolean) {
        setMentionsTeachersOnly(value);
        await AsyncStorage.setItem(MENTIONS_TEACHERS_ONLY_KEY, String(value));
    }

    async function handleSaveGrade() {
        const user = await getCurrentUser();
        if (!user) return;
        setSavingGrade(true);
        const { error } = await supabase
            .from("user_profile")
            .update({ grade: draftGrade.trim() || null })
            .eq("user_id", user.id);
        setSavingGrade(false);
        if (error) {
            Alert.alert("Error", "No se pudo guardar el curso.");
            return;
        }
        setGrade(draftGrade.trim());
        setEditingGrade(false);
        Alert.alert("Guardado", "Tu curso se ha actualizado correctamente.");
    }

    function handleStartEditGrade() {
        setDraftGrade(grade);
        setEditingGrade(true);
    }

    function handleCancelEditGrade() {
        setDraftGrade(grade);
        setEditingGrade(false);
    }

    async function handleLogout() {
        await supabase.auth.signOut();
    }

    function handleChangeProfilePhoto() {
        Alert.alert("Cambiar foto de perfil", "Esta funcionalidad se anadira en una siguiente iteracion.");
    }

    function handlePressSection(section: string) {
        setExpandedSection(expandedSection === section ? null : section);
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.content}>
                <Card style={styles.cardContainer}>
                    {SETTINGS_SECTIONS.map((section, index) => (
                        <View key={section.key}>
                            <TouchableOpacity
                                style={[
                                    styles.accordionHeader,
                                    index < SETTINGS_SECTIONS.length - 1 && expandedSection !== section.key && {
                                        borderBottomWidth: 1,
                                        borderBottomColor: colors.border,
                                    },
                                ]}
                                onPress={() => handlePressSection(section.key)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.accordionHeaderLeft}>
                                    <Ionicons name={section.icon as any} size={22} color={colors.icon} />
                                    <Text style={[styles.accordionTitle, { color: colors.text }]}>{section.label}</Text>
                                </View>
                                <Ionicons
                                    name={expandedSection === section.key ? "chevron-down" : "chevron-forward"}
                                    size={20}
                                    color={colors.icon}
                                />
                            </TouchableOpacity>

                            {expandedSection === section.key && (
                                <View style={[styles.accordionContent,
                                    index < SETTINGS_SECTIONS.length - 1 && {
                                        borderBottomWidth: 1,
                                        borderBottomColor: colors.border,
                                    }]}>
                                    {section.key === "tema" && (
                                        THEME_OPTIONS.map((option) => (
                                            <TouchableOpacity
                                                key={option.value}
                                                style={styles.optionRow}
                                                onPress={() => setTheme(option.value)}
                                                activeOpacity={0.7}
                                            >
                                                <View style={styles.optionInfo}>
                                                    <Ionicons
                                                        name={option.icon as any}
                                                        size={20}
                                                        color={colors.icon}
                                                    />
                                                    <Text style={[styles.optionLabel, { color: colors.text }]}>
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
                                        ))
                                    )}

                                    {section.key === "notificaciones" && (
                                        <>
                                            <View style={styles.optionRow}>
                                                <View style={styles.optionInfo}>
                                                    <Ionicons
                                                        name={notificationsEnabled ? "notifications-outline" : "notifications-off-outline"}
                                                        size={20}
                                                        color={colors.icon}
                                                    />
                                                    <Text style={[styles.optionLabel, { color: colors.text }]}>
                                                        Habilitar notificaciones
                                                    </Text>
                                                </View>
                                                <Switch
                                                    value={notificationsEnabled}
                                                    onValueChange={handleToggleNotifications}
                                                    trackColor={{ false: colors.border, true: colors.primary }}
                                                    thumbColor="#fff"
                                                />
                                            </View>
                                            <View style={styles.optionRow}>
                                                <View style={styles.optionInfo}>
                                                    <Ionicons
                                                        name={mentionsTeachersOnly ? "school-outline" : "school"}
                                                        size={20}
                                                        color={colors.icon}
                                                    />
                                                    <Text
                                                        style={[styles.optionLabel, styles.longOptionLabel, { color: colors.text }]}
                                                        numberOfLines={2}
                                                    >
                                                        Solo menciones del profesorado
                                                    </Text>
                                                </View>
                                                <Switch
                                                    value={mentionsTeachersOnly}
                                                    onValueChange={handleToggleTeacherMentions}
                                                    trackColor={{ false: colors.border, true: colors.primary }}
                                                    thumbColor="#fff"
                                                    style={styles.optionSwitch}
                                                />
                                            </View>
                                        </>
                                    )}

                                    {section.key === "cuenta" && (
                                        <View style={styles.optionContent}>
                                            <View style={styles.gradeSection}>
                                                <TouchableOpacity
                                                    style={[styles.optionRow, styles.gradeDisplayRow]}
                                                    onPress={handleStartEditGrade}
                                                    activeOpacity={0.7}
                                                >
                                                    <View style={styles.optionInfo}>
                                                        <Ionicons name="school-outline" size={20} color={colors.icon} />
                                                        <Text style={[styles.optionLabel, { color: colors.text }]}>
                                                            Curso
                                                        </Text>
                                                    </View>
                                                    <View style={styles.gradeRight}>
                                                        <Text style={[styles.gradeValue, { color: colors.textSecondary }]} numberOfLines={1}>
                                                            {grade || "Sin definir"}
                                                        </Text>
                                                        <View style={[styles.editBtn, { borderColor: colors.primary }]}>
                                                            <Ionicons name="pencil-outline" size={14} color={colors.primary} />
                                                            <Text style={[styles.editBtnText, { color: colors.primary }]}>Editar</Text>
                                                        </View>
                                                    </View>
                                                </TouchableOpacity>

                                                {editingGrade && (
                                                    <>
                                                        <TextInput
                                                            value={draftGrade}
                                                            onChangeText={setDraftGrade}
                                                            placeholder="Ej: 1 DAM"
                                                            placeholderTextColor={colors.placeholder}
                                                            style={[
                                                                styles.gradeInput,
                                                                {
                                                                    color: colors.text,
                                                                    borderColor: colors.border,
                                                                    backgroundColor: colors.surface,
                                                                },
                                                            ]}
                                                            maxLength={40}
                                                            autoFocus
                                                        />
                                                        <View style={styles.gradeActions}>
                                                            <Button
                                                                title="Cancelar"
                                                                onPress={handleCancelEditGrade}
                                                                variant="outline"
                                                                style={{ flex: 1 }}
                                                            />
                                                            <Button
                                                                title="Guardar curso"
                                                                onPress={handleSaveGrade}
                                                                loading={savingGrade}
                                                                variant="outline"
                                                                style={{ flex: 1 }}
                                                            />
                                                        </View>
                                                    </>
                                                )}
                                            </View>
                                            <Button
                                                title="Cambiar foto de perfil"
                                                onPress={handleChangeProfilePhoto}
                                                variant="outline"
                                                fullWidth
                                            />
                                        </View>
                                    )}
                                </View>
                            )}
                        </View>
                    ))}
                </Card>
            </View>
            <View style={styles.footer}>
                <Button
                    title="Cerrar sesion"
                    onPress={handleLogout}
                    variant="primary"
                    fullWidth
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: Spacing.xl,
    },
    content: {
        flex: 1,
    },
    cardContainer: {
        padding: 0,
        overflow: "hidden",
    },
    footer: {
        paddingTop: Spacing.lg,
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
    accordionContent: {
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.lg,
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
        paddingLeft: Spacing.sm,
        flex: 1,
        minWidth: 0,
    },
    optionLabel: {
        ...Typography.body,
    },
    longOptionLabel: {
        fontSize: 16,
        lineHeight: 21,
        flexShrink: 1,
    },
    optionSwitch: {
        marginLeft: Spacing.sm,
    },
    optionContent: {
        paddingVertical: Spacing.sm,
        paddingTop: Spacing.md,
        gap: Spacing.md,
    },
    gradeSection: {
        gap: Spacing.sm,
    },
    gradeDisplayRow: {
        paddingVertical: Spacing.sm,
    },
    gradeRight: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.xs,
        maxWidth: "55%",
    },
    gradeValue: {
        ...Typography.body,
    },
    editBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
    },
    editBtnText: {
        fontSize: 13,
        fontWeight: "600",
    },
    gradeInput: {
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
        ...Typography.body,
    },
    gradeActions: {
        flexDirection: "row",
        gap: Spacing.sm,
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
