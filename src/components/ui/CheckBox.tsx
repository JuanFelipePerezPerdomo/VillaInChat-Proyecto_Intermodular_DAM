import { Check } from "lucide-react-native";
import React, { useState } from "react";
import {
    Pressable,
    PressableProps,
    StyleSheet,
    View,
    ViewStyle,
} from "react-native";

// Tokens de color (ajústalos a tu tema)
const colors = {
  primary: "#0f172a",
  primaryForeground: "#ffffff",
  border: "#cbd5e1",
  ring: "#94a3b8",
  destructive: "#ef4444",
  disabled: "#94a3b8",
};

type CheckboxProps = Omit<PressableProps, "onPress"> & {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  invalid?: boolean;
  style?: ViewStyle;
};

function Checkbox({
  checked = false,
  onCheckedChange,
  disabled = false,
  invalid = false,
  style,
  ...props
}: CheckboxProps) {
  const [focused, setFocused] = useState(false);

  return (
    <Pressable
      role="checkbox"
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      onPress={() => !disabled && onCheckedChange?.(!checked)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      disabled={disabled}
      style={[
        styles.checkbox,
        checked && styles.checkboxChecked,
        focused && styles.checkboxFocused,
        invalid && styles.checkboxInvalid,
        disabled && styles.checkboxDisabled,
        style,
      ]}
      {...props}
    >
      {checked && (
        <View style={styles.indicator}>
          <Check
            size={14}
            color={disabled ? colors.disabled : colors.primaryForeground}
            strokeWidth={2.5}
          />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxFocused: {
    borderColor: colors.ring,
    // Simulamos el ring con un outline via shadowColor en iOS
    shadowColor: colors.ring,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 2,
  },
  checkboxInvalid: {
    borderColor: colors.destructive,
  },
  checkboxDisabled: {
    opacity: 0.5,
  },
  indicator: {
    alignItems: "center",
    justifyContent: "center",
  },
});

export { Checkbox };

