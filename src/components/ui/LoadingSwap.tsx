import { useTheme } from "@/src/hooks/useTheme";
import { Loader2 } from "lucide-react-native";
import React, { useEffect } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from "react-native-reanimated";

type LoadingSwapProps = {
  isLoading: boolean;
  children: React.ReactNode;
  style?: ViewStyle;
};

export function LoadingSwap({ isLoading, children, style }: LoadingSwapProps) {
  const { colors } = useTheme();

  const contentStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isLoading ? 0 : 1, { duration: 150 }),
  }));

  const loaderStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isLoading ? 1 : 0, { duration: 150 }),
  }));

  return (
    <View style={[styles.container, style]}>
      {/* Contenido real: le quitamos el absolute para que defina el tamaño del contenedor */}
      <Animated.View 
        style={contentStyle} 
        pointerEvents={isLoading ? "none" : "auto"} // Evita que se pueda hacer clic en el botón mientras carga
      >
        {children}
      </Animated.View>

      {/* Spinner: Este SÍ es absoluto para que se superponga encima del contenido */}
      <Animated.View 
        style={[styles.spinnerOverlay, loaderStyle]} 
        pointerEvents="none" // Evita que el spinner intercepte toques por error
      >
        <LoadingSpinner color={colors.primary} />
      </Animated.View>
    </View>
  );
}

function LoadingSpinner({ color }: { color: string }) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 700, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View style={spinStyle}>
      <Loader2 size={24} color={color} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    // El contenedor se adaptará al tamaño del botón que le pases como hijo
    justifyContent: "center",
  },
  spinnerOverlay: {
    ...StyleSheet.absoluteFillObject, // Cubre exactamente el mismo espacio que dejó el hijo
    alignItems: "center",
    justifyContent: "center",
  },
});