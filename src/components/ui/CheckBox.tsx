import { useTheme } from "@/src/hooks";
import { Check } from "lucide-react-native";
import React, { useState } from "react";
import {
    Pressable,
    PressableProps,
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

  const baseStyle: ViewStyle = {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  };

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
        baseStyle,
        checked && { backgroundColor: colors.primary, borderColor: colors.primary },
        focused && { borderColor: colors.primaryLight, shadowColor: colors.primaryLight, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 3, elevation: 2 },
        invalid && { borderColor: colors.error },
        disabled && { opacity: 0.5 },
        style,
      ]}
      {...props}
    >
      {checked && (
        <Check
          size={14}
          color={disabled ? colors.textSecondary : colors.textTertiary}
          strokeWidth={2.5}
        />
      )}
    </Pressable>
  );
}

export { Checkbox };
