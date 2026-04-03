import { Button } from "@/src/components/ui";
import { useTheme } from "@/src/hooks";
import { supabase } from "@/src/lib/supabase";
import { Spacing, Typography } from "@/src/themes";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Settings() {
    const { colors, isDark } = useTheme();

    async function handleLogout() {
        await supabase.auth.signOut();
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <Text style={[styles.title, { color: colors.text }]}>Ajustes</Text>

            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Apariencia</Text>
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.cardText, { color: colors.text }]}>Tema actual</Text>
                    <Text style={[styles.cardValue, { color: colors.textSecondary }]}>
                        {isDark ? "Oscuro" : "Claro"} (sistema)
                    </Text>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Cuenta</Text>
                <Button
                    title="Cerrar Sesion"
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
});
