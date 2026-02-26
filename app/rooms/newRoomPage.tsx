import { createRoom } from '@/src/actions/rooms';
import { Button, Card, Checkbox, Input, LoadingSwap } from '@/src/components/ui';
import { createRoomSchema } from "@/src/schemas/roomSchema";
import { Spacing, Typography } from "@/src/themes";
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { Alert, KeyboardAvoidingView, StyleSheet, Text, View, } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';

type FormData = z.infer<typeof createRoomSchema>

export default function newRoomPage(){
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
        <KeyboardAvoidingView style={styles.container}>
            <SafeAreaView style={styles.viewContainer}>
                <Card style={styles.card}>
                    <Text style={styles.cardTitle}>Crear un nuevo chat </Text>
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
                                <Text style={styles.checkboxLabel}>¿Este Chat es publico?</Text>
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