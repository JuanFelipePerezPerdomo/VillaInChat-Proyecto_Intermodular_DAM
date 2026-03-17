import { joinRoom, leaveRoom } from "@/src/actions";
import { useTheme } from "@/src/hooks";
import { BorderRadius, Spacing, Typography } from "@/src/themes";
import { Room } from "@/src/types";
import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type RoomCardProps = Room & {
  isJoined: boolean;
  onAction: () => void;
};

export function RoomCard({ id, name, memberCount, isJoined, onAction }: RoomCardProps) {
  const [loadingAction, setLoadingAction] = useState(false);
  const { colors, isDark } = useTheme();

  async function handleJoin() {
    setLoadingAction(true);
    await joinRoom(id);
    onAction();
    setLoadingAction(false);
  }

  async function handleLeave() {
    setLoadingAction(true);
    await leaveRoom(id);
    onAction();
    setLoadingAction(false);
  }

  const shadowStyle = {
    shadowColor: "#000",
    shadowOpacity: isDark ? 0.3 : 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: isDark ? 4 : 2,
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, shadowStyle]}>
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>{name}</Text>
        <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
          {memberCount} {memberCount === 1 ? "miembro" : "miembros"}
        </Text>
      </View>
      <View style={styles.cardFooter}>
        {isJoined ? (
          <>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: colors.primary, flex: 1, marginRight: 8 }]}
              onPress={() => router.push({ pathname: "/rooms/[id]", params: { id } })}
            >
              <Text style={styles.btnText}>Entrar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: colors.error }]}
              onPress={handleLeave}
              disabled={loadingAction}
            >
              <Text style={styles.btnText}>{loadingAction ? "..." : "Salir"}</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={[styles.btn, styles.btnOutline, { borderColor: colors.primary, flex: 1 }]}
            onPress={handleJoin}
            disabled={loadingAction}
          >
            <Text style={[styles.btnOutlineText, { color: colors.primary }]}>
              {loadingAction ? "Uniéndose..." : "Unirse"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  cardHeader: { marginBottom: Spacing.md, gap: Spacing.xs },
  cardTitle: { ...Typography.body, fontWeight: "600" },
  cardDescription: { ...Typography.caption },
  cardFooter: { flexDirection: "row" },
  btn: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  btnOutline: { borderWidth: 1, backgroundColor: "transparent" },
  btnText: { color: "#fff", ...Typography.buttonSmall },
  btnOutlineText: { ...Typography.buttonSmall },
});
