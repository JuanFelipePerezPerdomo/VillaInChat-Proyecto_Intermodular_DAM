import { createRoom } from '@/src/actions/rooms';
import { Button, Card, Input, LoadingSwap } from '@/src/components/ui';
import { useTheme } from '@/src/hooks';
import { createRoomSchema } from "@/src/schemas/roomSchema";
import { Spacing, Typography } from "@/src/themes";
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { Alert, KeyboardAvoidingView, StyleSheet, Text, TouchableOpacity, View, } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';

type FormData = z.infer<typeof createRoomSchema>

const CHAT_TYPE_OPTIONS: { value: FormData["chatType"]; label: string; description: string }[] = [
    { value: "PRIVATE",       label: "Privado",       description: "Solo miembros invitados" },
    { value: "PUBLIC",        label: "Público",       description: "Cualquiera puede unirse" },
    { value: "ANNOUNCEMENTS", label: "Anuncios",      description: "Solo roles especiales pueden escribir" },
]

export default function newRoomPage(){
    const { colors } = useTheme()
    const { control, handleSubmit, formState: {errors, isSubmitting}} = useForm<FormData>({
        defaultValues: {
            name: "",
            chatType: "PRIVATE"
        },
        resolver: zodResolver(createRoomSchema)
    })

    async function onSubmit(data: FormData) {
        await new Promise(resolve => setTimeout(resolve, 1000))
        const result = await createRoom(data)

        if(result.error) {
            console.error(result.message)
            Alert.alert("Error", result.message)
            return
        }

        router.push({
            pathname: `/rooms/[id]`,
            params: { id: result.roomId}
        });
    }

    return(
        <KeyboardAvoidingView style={styles.container}>
            <SafeAreaView style={styles.viewContainer}>
                <Card style={styles.card}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>Crear un nuevo chat </Text>
                    <Controller
                        control={control}
                        name="name"
                        render={({ field: { onChange, value } }) => (
                            <View>
                                <Input
                                    label="Nombre del Chat"
                                    value={value}
                                    onChangeText={onChange}
                                    placeholder="Inserte un nombre"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    error={errors.name?.message}
                                />
                            </View>
                        )}
                    />
                    <Controller
                        control={control}
                        name="chatType"
                        render={({ field: { onChange, value } }) => (
                            <View style={styles.typeContainer}>
                                <Text style={[styles.typeLabel, { color: colors.text }]}>Tipo de chat</Text>
                                {CHAT_TYPE_OPTIONS.map((option) => (
                                    <TouchableOpacity
                                        key={option.value}
                                        style={[
                                            styles.typeOption,
                                            { borderColor: colors.border },
                                            value === option.value && { borderColor: colors.primary, backgroundColor: colors.primary + "1a" }
                                        ]}
                                        onPress={() => onChange(option.value)}
                                    >
                                        <Text style={[
                                            styles.typeOptionLabel,
                                            { color: colors.text },
                                            value === option.value && { color: colors.primary }
                                        ]}>
                                            {option.label}
                                        </Text>
                                        <Text style={[styles.typeOptionDesc, { color: colors.textSecondary }]}>{option.description}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    />
                    <View style={styles.buttonContainer}>
                        <LoadingSwap isLoading={isSubmitting}>
                            <Button
                                title='Crear'
                                onPress={handleSubmit(onSubmit)}
                                size='medium'
                            />
                        </LoadingSwap>

                        <Button
                            title='Cancelar'
                            onPress={router.back}
                            size='medium'
                        />
                    </View>
                </Card>
            </SafeAreaView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    viewContainer: {
        flex: 1,
        justifyContent: "flex-start",
    },
    container: {
        flex: 1,
    },
    card: {
        marginBottom: Spacing.xl,
        justifyContent: 'center'
    },
    cardTitle: {
        ...Typography.h3,
        marginBottom: Spacing.lg,
    },
    form: {
        gap: Spacing.lg,
    },
    errorText: {
        textAlign: 'center',
        fontFamily: 'Roboto',
    },
    errorMessage: {
        fontSize: 14,
        fontFamily: 'Roboto',
    },
    footer: {
        padding: 5,
        alignItems: 'center',
    },
    footerText: {
        fontFamily: 'Roboto',
    },
    linkText: {
        fontFamily: 'RobotoBold',
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginTop: Spacing.md,
    },
    checkbox: {
        width: 28,
        height: 28,
    },
    checkboxLabel: {
        ...Typography.body,
        fontSize: 16,
    },
    buttonContainer: {
        flexDirection: 'row',
        alignContent: 'center',
        gap: Spacing.md,
        marginTop: Spacing.xl
    },
    typeContainer: {
        gap: Spacing.sm,
        marginTop: Spacing.md,
    },
    typeLabel: {
        ...Typography.body,
        fontWeight: "600",
        marginBottom: Spacing.xs,
    },
    typeOption: {
        borderWidth: 1,
        borderRadius: 8,
        padding: Spacing.md,
        gap: 2,
    },
    typeOptionLabel: {
        fontSize: 14,
        fontWeight: '600',
    },
    typeOptionDesc: {
        fontSize: 12,
    },
});
