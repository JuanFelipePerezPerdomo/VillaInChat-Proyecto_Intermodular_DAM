import { Button, Input } from "@/src/components/ui";
import { useTheme } from "@/src/hooks";
import { supabase } from "@/src/lib/supabase";
import { BorderRadius, Spacing, Typography } from "@/src/themes";
import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";

const signUpSchema = z.object({
    name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    email: z.string().email("Correo electrónico inválido"),
    password: z.string()
    .min(6, "La contraseña debe tener al menos 6 caracteres")
    .max(50, "la contraseña no puede exceder los 50 caracteres"),
    confirm: z.string("Este campo es obligatorio")
}).refine((data) => data.password === data.confirm, {
    message: "Las contraseñas no coinciden",
    path: ["confirm"]
});

type SignUpForm = z.infer<typeof signUpSchema>;

export default function SignUp() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { colors } = useTheme();

    const {control, handleSubmit, formState: { errors } } = useForm<SignUpForm>({
        resolver: zodResolver(signUpSchema)
    });

    const onSubmit = async (data: SignUpForm) => {
        try {
            setLoading(true);
            setError(null);

            const { error: signUpError } = await supabase.auth.signUp({
                email: data.email,
                password: data.password,
                options: {
                    data: {
                        name: data.name
                    }
                }
            });

            if (signUpError) {
                throw signUpError
            }

            const { error: loginError } = await supabase.auth.signInWithPassword({
                email: data.email,
                password: data.password
            });

            if (loginError){
                throw loginError;
            }

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ha ocurrido un error');
        } finally {
            setLoading(false)
        }
    };

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
                        <Text style={[styles.title, { color: colors.text }]}>Registrarse</Text>
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
                            render={({ field: {onChange, value}}) => (
                                <Input
                                    label="Nombre de Usuario"
                                    value={value}
                                    onChangeText={onChange}
                                    placeholder="Inserte su nombre"
                                    autoCapitalize="words"
                                    autoCorrect={false}
                                    error={errors.name?.message}
                                />
                            )}
                        />
                        <Controller
                            control={control}
                            name="email"
                            render={({ field: {onChange, value}}) => (
                                <Input
                                    label="Correo Electronico"
                                    value={value}
                                    onChangeText={onChange}
                                    placeholder="Inserte su correo"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    keyboardType="email-address"
                                    error={errors.email?.message}
                                />
                            )}
                        />
                        <Controller
                            control={control}
                            name="password"
                            render={({ field: {onChange, value}}) => (
                                <Input
                                    label="Contraseña"
                                    value={value}
                                    onChangeText={onChange}
                                    placeholder="Inserte su contraseña"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    secureTextEntry
                                    error={errors.password?.message}
                                />
                            )}
                        />
                        <Controller
                            control={control}
                            name="confirm"
                            render={({ field: {onChange, value}}) => (
                                <Input
                                    label="Confirmar Contraseña"
                                    value={value}
                                    onChangeText={onChange}
                                    placeholder="Confirme su contraseña"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    secureTextEntry
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
