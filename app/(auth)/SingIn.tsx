import { Input } from "@/src/components/ui";
import { supabase } from "@/src/lib/supabase";
import { useState } from "react";
import { Button, KeyboardAvoidingView, Text, View } from "react-native";

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

    // los estilos ya se encarga Martin, al menos hare que esto muestre algo
    return(
        <KeyboardAvoidingView>
            <Text>Iniciar Sesion</Text>
            <Controller
                control={control}
                name="email" // ya eventualmente intentaremos hacer que este login en vez de email DNI/NIE/Passaporte
                render={({ field: { onChange, value }}) => (
                    <View>
                        <Input // hacer un input personalizado en components/ui 
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
                name="password"
                render={({ field: { onChange, value } }) => (
                    <View >
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
                    </View>
                )}
            />

            <Button
                title="Iniciar Sesion"
                onPress={handleSubmit(onSubmit)}
                disabled={loading}
            />
        </KeyboardAvoidingView>
    );
}

// aqui tiene que ir un const styles = StyleSheet.create({});