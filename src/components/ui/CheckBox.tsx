import { useTheme } from "@/src/hooks";
import { BorderRadius } from "@/src/themes";
import { Check } from "lucide-react-native";
import { useState } from "react";
import {
  Pressable,
  PressableProps,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";

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
  const { colors } = useTheme();

  const checkedStyle = checked ? {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  } : {};

  const focusedStyle = focused ? {
    borderColor: colors.textTertiary,
    shadowColor: colors.textTertiary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 2,
  } : {};

  const invalidStyle = invalid ? {
    borderColor: colors.error,
  } : {};

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
        { borderColor: colors.border },
        checkedStyle,
        focusedStyle,
        invalidStyle,
        disabled && styles.checkboxDisabled,
        style,
      ]}
      {...props}
    >
      {checked && (
        <View style={styles.indicator}>
          <Check
            size={14}
            color={disabled ? colors.textTertiary : "#ffffff"}
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
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
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

