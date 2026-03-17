import { Button, Input } from "@/src/components/ui";
import { useTheme } from "@/src/hooks";
import { supabase } from "@/src/lib/supabase";
import { BorderRadius, Spacing, Typography } from "@/src/themes";
import { router } from "expo-router";
import { useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

const SignInSchema = z.object({
    email: z.string().email("Correo Electronico Invalido"),
    password: z.string()
    .min(6, "La contraseña debe tener al menos 6 caracteres")
    .max(50, "La contraseña no puede sobrepasar los 50 caracteres")
});

type SignInForm = z.infer<typeof SignInSchema>

export default function SignIn() {

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { colors } = useTheme();
    const passwordRef = useRef<TextInput>(null);

    const { control, handleSubmit, formState: {errors} } = useForm<SignInForm>({
        resolver: zodResolver(SignInSchema)
    });

    const onSubmit = async (data:SignInForm) => {
        try{
            setLoading(true);
            setError(null);

            const { error: loginError } = await supabase.auth.signInWithPassword({
                email: data.email,
                password: data.password
            })

            if(loginError) throw loginError;

        } catch (err) {
            setError(err instanceof Error ? err.message : "Ha ocurrido un error");
        } finally{
            setLoading(false);
        }
    }

    return(
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.headerSection}>
                        <Text style={[styles.title, { color: colors.text }]}>Iniciar Sesion</Text>
                        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                            Bienvenido de vuelta
                        </Text>
                    </View>

                    <View style={styles.form}>
                        {error && (
                            <View style={[styles.errorContainer, { backgroundColor: colors.error + '15', borderColor: colors.error + '30' }]}>
                                <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
                            </View>
                        )}

                        <Controller
                            control={control}
                            name="email"
                            render={({ field: { onChange, value }}) => (
                                <Input
                                    label="Correo Electronico"
                                    value={value}
                                    onChangeText={onChange}
                                    placeholder="Inserte su correo"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    keyboardType="email-address"
                                    returnKeyType="next"
                                    onSubmitEditing={() => passwordRef.current?.focus()}
                                    blurOnSubmit={false}
                                    error={errors.email?.message}
                                />
                            )}
                        />
                        <Controller
                            control={control}
                            name="password"
                            render={({ field: { onChange, value } }) => (
                                <Input
                                    ref={passwordRef}
                                    label="Contraseña"
                                    value={value}
                                    onChangeText={onChange}
                                    placeholder="Inserte su contraseña"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    secureTextEntry
                                    returnKeyType="done"
                                    onSubmitEditing={handleSubmit(onSubmit)}
                                    error={errors.password?.message}
                                />
                            )}
                        />

                        <Button
                            title="Iniciar Sesion"
                            onPress={handleSubmit(onSubmit)}
                            disabled={loading}
                            loading={loading}
                            fullWidth
                        />
                    </View>

                    <View style={styles.footer}>
                        <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                            ¿No tienes una cuenta?{' '}
                        </Text>
                        <TouchableOpacity onPress={() => router.push('/SignUp')}>
                            <Text style={[styles.linkText, { color: colors.primary }]}>Registrate</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    flex: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: Spacing.xl,
    },
    headerSection: {
        alignItems: 'center',
        marginBottom: Spacing.xxl,
    },
    title: {
        ...Typography.h1,
        marginBottom: Spacing.xs,
    },
    subtitle: {
        ...Typography.body,
    },
    form: {
        gap: Spacing.lg,
    },
    errorContainer: {
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
    },
    errorText: {
        ...Typography.bodySmall,
        textAlign: 'center',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: Spacing.xxl,
    },
    footerText: {
        ...Typography.body,
    },
    linkText: {
        ...Typography.button,
    },
});
