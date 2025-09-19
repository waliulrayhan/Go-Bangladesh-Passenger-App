import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import { BORDER_RADIUS, COLORS, SIZES, SPACING } from '../../utils/constants';
import { Text } from './Text';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'orange' | 'outline' | 'danger' | 'success';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  fullWidth = false
}) => {
  const buttonStyle = [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth && styles.fullWidth,
    (disabled || loading) && styles.disabled,
  ];

  const textStyle = [
    styles.text,
    styles[`text_${variant}`],
    styles[`text_${size}`],
  ];

  const iconColor = variant === 'primary' || variant === 'orange' || variant === 'danger' || variant === 'success' 
    ? COLORS.white 
    : variant === 'secondary'
    ? COLORS.gray[700]
    : COLORS.primary;

  const getIconSize = () => {
    switch (size) {
      case 'small': return SIZES.icon.sm;
      case 'large': return SIZES.icon.lg;
      default: return SIZES.icon.md;
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'primary':
      case 'orange':
      case 'danger':
      case 'success':
        return COLORS.white;
      case 'secondary':
        return COLORS.gray[700];
      case 'outline':
        return COLORS.primary;
      default:
        return COLORS.white;
    }
  };

  const renderContent = () => (
    <View style={styles.content}>
      {icon && iconPosition === 'left' && !loading && (
        <Ionicons 
          name={icon} 
          size={getIconSize()} 
          color={iconColor} 
          style={styles.iconLeft} 
        />
      )}
      {loading ? (
        <ActivityIndicator color={iconColor} size={size === 'large' ? 'large' : 'small'} />
      ) : (
        <Text 
          variant={size === 'large' ? 'buttonLarge' : size === 'small' ? 'buttonSmall' : 'button'}
          color={getTextColor()}
        >
          {title}
        </Text>
      )}
      {icon && iconPosition === 'right' && !loading && (
        <Ionicons 
          name={icon} 
          size={getIconSize()} 
          color={iconColor} 
          style={styles.iconRight} 
        />
      )}
    </View>
  );

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  primary: {
    backgroundColor: COLORS.primary,
  },
  orange: {
    backgroundColor: COLORS.secondary,
  },
  secondary: {
    backgroundColor: COLORS.gray[100],
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  danger: {
    backgroundColor: COLORS.error,
  },
  success: {
    backgroundColor: COLORS.success,
  },
  small: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    minHeight: SIZES.button.sm,
  },
  medium: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    minHeight: SIZES.button.md,
  },
  large: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    minHeight: SIZES.button.lg,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.6,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    textAlign: 'center',
  },
  text_primary: {
    color: COLORS.white,
  },
  text_orange: {
    color: COLORS.white,
  },
  text_secondary: {
    color: COLORS.gray[700],
  },
  text_outline: {
    color: COLORS.primary,
  },
  text_danger: {
    color: COLORS.white,
  },
  text_success: {
    color: COLORS.white,
  },
  text_small: {
    fontSize: 14,
  },
  text_medium: {
    fontSize: 16,
  },
  text_large: {
    fontSize: 18,
  },
  iconLeft: {
    marginRight: SPACING.xs + 2,
  },
  iconRight: {
    marginLeft: SPACING.xs + 2,
  },
});

