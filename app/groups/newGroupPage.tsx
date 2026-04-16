import { createGroup } from "@/src/actions";
import { Button, Card, Input, LoadingSwap, UserSearchPicker } from "@/src/components/ui";
import { useTheme } from "@/src/hooks";
import { createGroupSchema } from "@/src/schemas/groupSchema";
import { getCurrentUser } from "@/src/services/getCurrentUser";
import { UserSearchResult } from "@/src/services/searchUsers";
import { Spacing, Typography } from "@/src/themes";
import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert, KeyboardAvoidingView, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";

type FormData = z.infer<typeof createGroupSchema>

export default function NewGroupPage() {
    const { isDark } = useTheme()
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)
    const [selectedUsers, setSelectedUsers] = useState<UserSearchResult[]>([])

    const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
        defaultValues: { name: "" },
        resolver: zodResolver(createGroupSchema),
    })

    useEffect(() => {
        getCurrentUser().then((user) => setCurrentUserId(user?.id ?? null))
    }, [])

    function handleAddUser(user: UserSearchResult) {
        setSelectedUsers((prev) => [...prev, user])
    }

    function handleRemoveUser(userId: string) {
        setSelectedUsers((prev) => prev.filter((u) => u.user_id !== userId))
    }

    async function onSubmit(data: FormData) {
        const memberIds = selectedUsers.map((u) => u.user_id)
        const result = await createGroup(data, memberIds)

        if (result.error) {
            Alert.alert("Error", result.message)
            return
        }

        router.replace({ pathname: "/groups/[id]" as any, params: { id: result.groupId } })
    }

    return (
        <KeyboardAvoidingView style={styles.container}>
            <SafeAreaView style={styles.viewContainer}>
                <ScrollView keyboardShouldPersistTaps="handled">
                    <Card style={styles.card}>
                        <Text style={styles.cardTitle}>Crear un nuevo grupo</Text>

                        <Controller
                            control={control}
                            name="name"
                            render={({ field: { onChange, value } }) => (
                                <Input
                                    label="Nombre del grupo"
                                    labelColor={isDark ? undefined : "#000000"}
                                    inputTextColor={isDark ? undefined : "#ffffff"}
                                    placeholderTextColor={isDark ? undefined : "#000000"}
                                    value={value}
                                    onChangeText={onChange}
                                    placeholder="Inserte un nombre"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    error={errors.name?.message}
                                />
                            )}
                        />

                        <UserSearchPicker
                            excludeId={currentUserId}
                            selectedUsers={selectedUsers}
                            onAdd={handleAddUser}
                            onRemove={handleRemoveUser}
                        />

                        <View style={styles.buttonContainer}>
                            <LoadingSwap isLoading={isSubmitting}>
                                <Button
                                    title="Crear"
                                    onPress={handleSubmit(onSubmit)}
                                    size="medium"
                                />
                            </LoadingSwap>
                            <Button
                                title="Cancelar"
                                onPress={router.back}
                                size="medium"
                            />
                        </View>
                    </Card>
                </ScrollView>
            </SafeAreaView>
        </KeyboardAvoidingView>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    viewContainer: { flex: 1, justifyContent: "flex-start" },
    card: { marginBottom: Spacing.xl, justifyContent: "center" },
    cardTitle: { ...Typography.h3, marginBottom: Spacing.lg },
    buttonContainer: {
        flexDirection: "row",
        gap: Spacing.md,
        marginTop: Spacing.xl,
    },
})
