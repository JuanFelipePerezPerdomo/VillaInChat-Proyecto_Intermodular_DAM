import { useTheme } from "@/src/hooks/useTheme";
import { BorderRadius, FontSize, Spacing, Typography } from "@/src/themes";
import React, { forwardRef, useState } from "react";
import {
    StyleSheet,
    Text,
    TextInput,
    TextInputProps,
    View,
    ViewStyle,
} from "react-native";

interface InputProps extends Omit<TextInputProps, "style">{
    label?: string,
    labelColor?: string,
    inputTextColor?: string,
    error?: string,
    hint?: string,
    showCharCount?: boolean,
    maxLength?: number;
    containerStyle?: ViewStyle;
}

export const Input = forwardRef<TextInput, InputProps>(function Input({
    label,
    labelColor,
    inputTextColor,
    error,
    hint,
    showCharCount = false,
    maxLength,
    containerStyle,
    value,
    onChangeText,
    ...textInputProps
}, ref){
    const {colors} = useTheme();
    const [isFocused, setIsFocused] = useState(false);

    const getBorderColor = () => {
        if (error) return colors.error;
        if (isFocused) return colors.primary;
        return colors.border;
    };

    const charCount = value?.length ?? 0;

    return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: labelColor ?? colors.text }]}>{label}</Text>
      )}

      <TextInput
        ref={ref}
        value={value}
        onChangeText={onChangeText}
        maxLength={maxLength}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholderTextColor={textInputProps.placeholderTextColor ?? colors.placeholder}
        style={[
          styles.input,
          {
            backgroundColor: colors.surface,
            borderColor: getBorderColor(),
            color: inputTextColor ?? colors.text,
          },
        ]}
        {...textInputProps}
      />

      <View style={styles.footer}>
        {error ? (
          <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
        ) : hint ? (
          <Text style={[styles.hint, { color: colors.textTertiary }]}>
            {hint}
          </Text>
        ) : (
          <View />
        )}

        {showCharCount && maxLength && (
          <Text
            style={[
              styles.charCount,
              {
                color:
                  charCount >= maxLength ? colors.error : colors.textTertiary,
              },
            ]}
          >
            {charCount}/{maxLength}
          </Text>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
    container: {
    width: "100%",
    },
    label: {
    ...Typography.label,
    marginBottom: Spacing.xs,
    },
    input: {
        borderWidth: 1,
        borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
        fontSize: FontSize.md,
    },
    footer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: Spacing.xs,
        minHeight: 20,
    },
    error: {
        ...Typography.caption,
    },
    hint: {
        ...Typography.caption,
    },
    charCount: {
        ...Typography.caption,
    },
});