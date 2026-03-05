import { createRoom } from '@/src/actions/rooms';
import { Button, Card, Checkbox, Input, LoadingSwap } from '@/src/components/ui';
import { useTheme } from '@/src/hooks';
import { createRoomSchema } from "@/src/schemas/roomSchema";
import { Spacing, Typography } from "@/src/themes";
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';

type FormData = z.infer<typeof createRoomSchema>

export default function newRoomPage(){
    const { colors } = useTheme();
    const { control, handleSubmit, formState: {errors, isSubmitting}} = useForm<FormData>({
        defaultValues: {
            name: "",
            isPublic: false
        },
        resolver: zodResolver(createRoomSchema)
    })

    async function onSubmit (data: FormData) {
        await new Promise(resolve => setTimeout(resolve, 1000))
        console.log(data)

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
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: colors.background }]}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <SafeAreaView style={styles.viewContainer}>
                <Card style={styles.card}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>Crear un nuevo chat</Text>
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
                        name="isPublic"
                        render={({ field: { onChange, value, ...field } }) => (
                            <View style={styles.checkboxContainer}>
                                <Checkbox
                                    {...field}
                                    id={field.name}
                                    checked={value}
                                    onCheckedChange={onChange}
                                    style={styles.checkbox}
                                />
                                <Text style={[styles.checkboxLabel, { color: colors.text }]}>
                                    ¿Este Chat es publico?
                                </Text>
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
                            variant='outline'
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
    }
});
