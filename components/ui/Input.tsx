import { Ionicons } from '@expo/vector-icons';
import React, { ReactNode, useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { BORDER_RADIUS, COLORS, SIZES, SPACING } from '../../utils/constants';
import { TYPOGRAPHY } from '../../utils/fonts';
import { Text } from './Text';

interface InputProps {
  label?: string | ReactNode;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  editable?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  multiline?: boolean;
  numberOfLines?: number;
  maxLength?: number;
}

export const Input: React.FC<InputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  editable = true,
  icon,
  rightIcon,
  onRightIconPress,
  multiline = false,
  numberOfLines = 1,
  maxLength
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const borderWidth = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      borderWidth: borderWidth.value,
    };
  });

  const handleFocus = () => {
    setIsFocused(true);
    borderWidth.value = withSpring(2);
  };

  const handleBlur = () => {
    setIsFocused(false);
    borderWidth.value = withSpring(1);
  };

  const inputStyle = [
    styles.input,
    isFocused && styles.inputFocused,
    error && styles.inputError,
    !editable && styles.inputDisabled,
    multiline && styles.inputMultiline,
    icon && styles.inputWithIcon
  ];

  return (
    <View style={styles.container}>
      {label && (
        typeof label === 'string' ? (
          <Text variant="label" color={COLORS.gray[700]}>{label}</Text>
        ) : (
          <View style={styles.labelContainer}>{label}</View>
        )
      )}
      <Animated.View style={[styles.inputContainer, animatedStyle]}>
        {icon && (
          <Ionicons 
            name={icon} 
            size={SIZES.icon.md} 
            color={isFocused ? COLORS.primary : COLORS.gray[400]} 
            style={styles.icon} 
          />
        )}
        <TextInput
          style={inputStyle}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.gray[400]}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onFocus={handleFocus}
          onBlur={handleBlur}
          editable={editable}
          multiline={multiline}
          numberOfLines={numberOfLines}
          maxLength={maxLength}
          textAlignVertical={multiline ? 'top' : 'center'}
        />
        {rightIcon && (
          <TouchableOpacity onPress={onRightIconPress} style={styles.rightIconButton}>
            <Ionicons 
              name={rightIcon} 
              size={SIZES.icon.md} 
              color={isFocused ? COLORS.primary : COLORS.gray[400]} 
            />
          </TouchableOpacity>
        )}
      </Animated.View>
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={SIZES.icon.sm} color={COLORS.error} />
          <Text variant="bodySmall" color={COLORS.error} style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.lg,
  },
  labelContainer: {
    marginBottom: SPACING.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    marginTop: SPACING.xs,
  },
  input: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    ...TYPOGRAPHY.body,
    color: COLORS.gray[900],
    minHeight: SIZES.input.md,
  },
  inputWithIcon: {
    paddingLeft: SPACING.sm,
  },
  inputMultiline: {
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputFocused: {
    borderColor: COLORS.primary,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  inputDisabled: {
    backgroundColor: COLORS.gray[100],
    color: COLORS.gray[500],
  },
  icon: {
    marginLeft: SPACING.md,
    marginRight: SPACING.sm,
  },
  rightIconButton: {
    padding: SPACING.sm,
    marginRight: SPACING.sm,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  errorText: {
    marginLeft: SPACING.xs,
    flex: 1,
  },
});
