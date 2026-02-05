
import { Input } from "@/src/components/ui";
import { useTheme } from "@/src/hooks";
import { Spacing, Typography } from "@/src/themes";
import { router } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Button, KeyboardAvoidingView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { z } from "zod";

import { supabase } from "@/src/lib/supabase";
import { zodResolver } from "@hookform/resolvers/zod";

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

    const { colors } = useTheme();

    return(
        <KeyboardAvoidingView style = {styles.container}>

            <Text 
            style={[styles.cardTitle, 
            { color: colors.text }]}>
                Registrarse
            </Text>
            <Controller
                control={control}
                name="email"
                render={({ field: {onChange, value}}) => (
                    <View>
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
                    </View>  
                )}
            />
            <Controller
                control={control}
                name="name"
                render={({ field: {onChange, value}}) => (
                    <View>
                        <Input
                            label="Nombre de Usuario"
                            value={value}
                            onChangeText={onChange}
                            placeholder="Inserte su nombre"
                            autoCapitalize="words"
                            autoCorrect={false}
                            error={errors.name?.message}
                        />
                    </View>
                )}
            />
            <Controller
                control={control}
                name="password"
                render={({ field: {onChange, value}}) => (
                    <View>
                        <Input
                            label="Contraseña"
                            onChangeText={onChange}
                            placeholder="Inserte su contraseña"
                            autoCapitalize="none"
                            autoCorrect={false}
                            secureTextEntry
                            error={errors.password?.message}
                        />
                    </View>
                )}
            />
            <Controller
                control={control}
                name="confirm"
                render={({ field: {onChange, value}}) => (
                    <View>
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
                    </View>
                )}
            />
            <Button
                title="Registrarse"
                onPress={handleSubmit(onSubmit)}
                disabled={loading}
            />
            <View 
            style={styles.footer}
            >
                <Text style={styles.footerText}>
                    ¿Ya tienes una cuenta?{' '}
                    <TouchableOpacity onPress={() => router.push('/SignIn')}>
                        <Text style={styles.linkText}>Inicia Sesion</Text>
                    </TouchableOpacity>
                </Text>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    card: {
        marginBottom: Spacing.xl,
    },
    cardTitle: {
        ...Typography.h3,
        marginBottom: Spacing.lg,
    },
    errorText: {
    color: '#dc2626',
    textAlign: 'center',
    fontFamily: 'Roboto',
    },
    errorMessage: {
        color: '#dc2626',
        fontSize: 14,
        fontFamily: 'Roboto',
    },
    footer: {
        padding: 5,
        alignItems: 'center',
    },
    footerText: {
        fontFamily: 'Roboto',
        color: '#666',
    },
    linkText: {
        color: '#6366f1',
        fontFamily: 'RobotoBold',
    },
})