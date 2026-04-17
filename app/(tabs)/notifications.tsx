import { useTheme } from "@/src/hooks"
import { useNotificationContext } from "@/src/providers/NotificationProvider"
import { BorderRadius, Spacing, Typography } from "@/src/themes"
import { MentionWithDetails } from "@/src/types"
import { Ionicons } from "@expo/vector-icons"
import { useFocusEffect } from "expo-router"
import { router } from "expo-router"
import { useCallback } from "react"
import {
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

export default function Notifications() {
    const { colors } = useTheme()
    const { mentions, mentionUnreadCount: unreadCount, markAsRead, markAllAsRead, refresh } = useNotificationContext()

    // Refrescar cada vez que el usuario navega a esta pantalla
    useFocusEffect(useCallback(() => { refresh() }, [refresh]))

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>

            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                <Text style={[styles.title, { color: colors.text }]}>Menciones</Text>
                {unreadCount > 0 && (
                    <TouchableOpacity
                        onPress={markAllAsRead}
                        hitSlop={8}
                        style={[styles.markAllWrapper, { borderColor: colors.primary }]}
                    >
                        <Text style={[styles.markAllBtn, { color: colors.primary }]}>
                            Marcar todas leídas
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            <FlatList
                data={mentions}
                keyExtractor={item => item.mention_id.toString()}
                contentContainerStyle={mentions.length === 0 ? styles.emptyContainer : styles.list}
                renderItem={({ item }) => (
                    <MentionCard
                        mention={item}
                        onPress={() => {
                            if (!item.read) markAsRead(item.mention_id)
                            router.push(`/rooms/${item.FK_chat_id}`)
                        }}
                        onMarkRead={() => markAsRead(item.mention_id)}
                    />
                )}
                ListEmptyComponent={
                    <View style={styles.center}>
                        <Ionicons name="notifications-off-outline" size={52} color={colors.border} />
                        <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
                            Sin menciones por ahora
                        </Text>
                    </View>
                }
            />
        </SafeAreaView>
    )
}

// ─── MentionCard ──────────────────────────────────────────────────────────────

function MentionCard({
    mention,
    onPress,
    onMarkRead,
}: {
    mention: MentionWithDetails
    onPress: () => void
    onMarkRead: () => void
}) {
    const { colors } = useTheme()
    const isUnread = !mention.read
    const isEveryone = mention.type === "EVERYONE"

    const senderName = mention.sender?.username ?? "Alguien"
    const chatName   = mention.chat?.name ?? "Chat"
    const preview    = mention.message?.content ?? ""
    const time       = new Date(mention.created_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    })
    const dateStr = new Date(mention.created_at).toLocaleDateString([], {
        day: "2-digit",
        month: "2-digit",
    })

    return (
        <TouchableOpacity
            style={[
                styles.card,
                {
                    backgroundColor: isUnread ? colors.primary + "10" : colors.card,
                    borderColor: isUnread ? colors.primary + "40" : colors.border,
                },
            ]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            {/* Unread dot */}
            {isUnread && (
                <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
            )}

            {/* Avatar */}
            <View style={[styles.avatar, { backgroundColor: isEveryone ? colors.warning + "22" : colors.primary + "22" }]}>
                {isEveryone ? (
                    <Ionicons name="megaphone-outline" size={18} color={colors.warning ?? "#f59e0b"} />
                ) : (
                    <Text style={[styles.avatarInitial, { color: colors.primary }]}>
                        {senderName[0].toUpperCase()}
                    </Text>
                )}
            </View>

            {/* Content */}
            <View style={styles.cardContent}>
                <View style={styles.cardTop}>
                    <Text style={[styles.senderName, { color: colors.text }]}>
                        {isEveryone ? `${senderName} mencionó a todos` : `${senderName} te mencionó`}
                    </Text>
                    <Text style={[styles.time, { color: colors.textTertiary }]}>
                        {dateStr} {time}
                    </Text>
                </View>
                <Text style={[styles.chatName, { color: colors.primary }]} numberOfLines={1}>
                    #{chatName}
                </Text>
                <Text style={[styles.preview, { color: colors.textSecondary }]} numberOfLines={2}>
                    {preview}
                </Text>
            </View>

            {/* Mark read button */}
            {isUnread && (
                <TouchableOpacity
                    style={styles.readBtn}
                    onPress={(e) => { e.stopPropagation?.(); onMarkRead() }}
                    hitSlop={8}
                >
                    <Ionicons name="checkmark-circle-outline" size={20} color={colors.primary} />
                </TouchableOpacity>
            )}
        </TouchableOpacity>
    )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container:      { flex: 1 },
    center:         { flex: 1, justifyContent: "center", alignItems: "center", gap: Spacing.md },
    emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center" },

    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: Spacing.lg,
        borderBottomWidth: 1,
    },
    title:       { ...Typography.h2, fontWeight: "700" },
    markAllWrapper: {
        borderWidth: 1,
        borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
    },
    markAllBtn:  { fontSize: 13, fontWeight: "600" },

    list:      { padding: Spacing.md, gap: Spacing.sm },
    emptyText: { ...Typography.bodySmall },

    card: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: Spacing.sm,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        padding: Spacing.md,
        position: "relative",
    },
    unreadDot: {
        position: "absolute",
        top: Spacing.md,
        right: Spacing.md,
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },
    avatarInitial: { fontSize: 16, fontWeight: "700" },
    cardContent:   { flex: 1, gap: 2 },
    cardTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "baseline",
        gap: Spacing.sm,
    },
    senderName: { fontSize: 14, fontWeight: "600", flex: 1 },
    time:       { fontSize: 11 },
    chatName:   { fontSize: 12, fontWeight: "600" },
    preview:    { fontSize: 13, lineHeight: 18 },
    readBtn:    { padding: 2, alignSelf: "center" },
})
