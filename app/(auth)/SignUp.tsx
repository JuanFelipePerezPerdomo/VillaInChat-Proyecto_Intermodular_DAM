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

const signUpSchema = z.object({
    name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    phone: z.string()
        .min(9, "El teléfono debe tener al menos 9 dígitos")
        .refine((val) => /^\+?[\d\s\-()+]+$/.test(val), "Número de teléfono inválido"),
    email: z.string().email("Correo electrónico inválido"),
    password: z.string()
        .min(6, "La contraseña debe tener al menos 6 caracteres")
        .max(50, "La contraseña no puede exceder los 50 caracteres"),
    confirm: z.string()
}).refine((data) => data.password === data.confirm, {
    message: "Las contraseñas no coinciden",
    path: ["confirm"]
});

type SignUpForm = z.infer<typeof signUpSchema>;

export default function SignUp() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { colors, isDark } = useTheme();

    const phoneRef = useRef<TextInput>(null);
    const emailRef = useRef<TextInput>(null);
    const passwordRef = useRef<TextInput>(null);
    const confirmRef = useRef<TextInput>(null);

    const { control, handleSubmit, formState: { errors } } = useForm<SignUpForm>({
        resolver: zodResolver(signUpSchema)
    });

    const onSubmit = async (data: SignUpForm) => {
        try {
            setLoading(true);
            setError(null);

            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                email: data.email,
                password: data.password,
                options: { data: { name: data.name } }
            });

            if (signUpError) throw signUpError;

            const userId = signUpData.user?.id;
            if (!userId) throw new Error("No se pudo obtener el ID de usuario");

            const { error: profileError } = await supabase
                .from("user_profile")
                .insert({
                    user_id: userId,
                    username: data.name,
                    phone: data.phone,
                });

            if (profileError) throw profileError;

            const { error: loginError } = await supabase.auth.signInWithPassword({
                email: data.email,
                password: data.password
            });

            if (loginError) throw loginError;

            router.replace('/home');

        } catch (err) {
            setError(err instanceof Error ? err.message : "Ha ocurrido un error");
        } finally {
            setLoading(false);
        }
    };

    const labelColor = isDark ? "#5f547d" : "#000000";

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={Platform.OS === 'web' ? styles.webFormWrapper : undefined}>
                        <View style={styles.headerSection}>
                            <Text style={[styles.title, { color: isDark ? "#5f547d" : "#000000" }]}>Registrarse</Text>
                            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                                Crea tu cuenta
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
                                name="name"
                                render={({ field: { onChange, value } }) => (
                                    <Input
                                        label="Nombre de Usuario"
                                        labelColor={labelColor}
                                        value={value}
                                        onChangeText={onChange}
                                        placeholder="Inserte su nombre"
                                        autoCapitalize="words"
                                        autoCorrect={false}
                                        returnKeyType="next"
                                        onSubmitEditing={() => phoneRef.current?.focus()}
                                        blurOnSubmit={false}
                                        error={errors.name?.message}
                                    />
                                )}
                            />

                            <Controller
                                control={control}
                                name="phone"
                                render={({ field: { onChange, value } }) => (
                                    <Input
                                        ref={phoneRef}
                                        label="Número de Teléfono"
                                        labelColor={labelColor}
                                        value={value}
                                        onChangeText={onChange}
                                        placeholder="+34 600 000 000"
                                        keyboardType="phone-pad"
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        returnKeyType="next"
                                        onSubmitEditing={() => emailRef.current?.focus()}
                                        blurOnSubmit={false}
                                        error={errors.phone?.message}
                                    />
                                )}
                            />

                            <Controller
                                control={control}
                                name="email"
                                render={({ field: { onChange, value } }) => (
                                    <Input
                                        ref={emailRef}
                                        label="Correo Electronico"
                                        labelColor={labelColor}
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
                                render={({ field: { onChange } }) => (
                                    <Input
                                        ref={passwordRef}
                                        label="Contraseña"
                                        labelColor={labelColor}
                                        onChangeText={onChange}
                                        placeholder="Inserte su contraseña"
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        secureTextEntry
                                        returnKeyType="next"
                                        onSubmitEditing={() => confirmRef.current?.focus()}
                                        blurOnSubmit={false}
                                        error={errors.password?.message}
                                    />
                                )}
                            />

                            <Controller
                                control={control}
                                name="confirm"
                                render={({ field: { onChange } }) => (
                                    <Input
                                        ref={confirmRef}
                                        label="Confirmar Contraseña"
                                        labelColor={labelColor}
                                        onChangeText={onChange}
                                        placeholder="Confirme su contraseña"
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        secureTextEntry
                                        returnKeyType="done"
                                        onSubmitEditing={handleSubmit(onSubmit)}
                                        error={errors.confirm?.message}
                                    />
                                )}
                            />

                            <Button
                                title="Registrarse"
                                onPress={handleSubmit(onSubmit)}
                                disabled={loading}
                                loading={loading}
                                fullWidth
                            />
                        </View>

                        <View style={styles.footer}>
                            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                                ¿Ya tienes una cuenta?{' '}
                            </Text>
                            <TouchableOpacity onPress={() => router.push('/SignIn')}>
                                <Text style={[styles.linkText, { color: colors.primary }]}>Inicia Sesion</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1 },
    flex: { flex: 1 },
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
    webFormWrapper: {
        width: '100%',
        maxWidth: 480,
        alignSelf: 'center',
    },
});
