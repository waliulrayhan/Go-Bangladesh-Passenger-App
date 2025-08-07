import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming
} from 'react-native-reanimated';
import { COLORS, SPACING } from '../../utils/constants';
import { Text } from './Text';

export interface ToastProps {
  visible: boolean;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onHide?: () => void;
  position?: 'top' | 'bottom';
}

const TOAST_HEIGHT = 80;

export const Toast: React.FC<ToastProps> = ({
  visible,
  message,
  type = 'info',
  duration = 4000,
  onHide,
  position = 'top',
}) => {
  const translateY = useSharedValue(position === 'top' ? -TOAST_HEIGHT : TOAST_HEIGHT);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const getToastConfig = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: COLORS.success,
          icon: 'checkmark-circle' as const,
          borderColor: COLORS.success,
        };
      case 'error':
        return {
          backgroundColor: COLORS.error,
          icon: 'alert-circle' as const,
          borderColor: COLORS.error,
        };
      case 'warning':
        return {
          backgroundColor: '#f59e0b',
          icon: 'warning' as const,
          borderColor: '#f59e0b',
        };
      case 'info':
      default:
        return {
          backgroundColor: COLORS.primary,
          icon: 'information-circle' as const,
          borderColor: COLORS.primary,
        };
    }
  };

  const config = getToastConfig();

  const hideToast = () => {
    if (onHide) {
      onHide();
    }
  };

  useEffect(() => {
    if (visible) {
      // Show animation
      translateY.value = withSpring(0, {
        damping: 15,
        stiffness: 150,
      });
      opacity.value = withTiming(1, { duration: 300 });
      scale.value = withSpring(1, {
        damping: 12,
        stiffness: 200,
      });

      // Auto hide after duration
      if (duration > 0) {
        timeoutRef.current = setTimeout(() => {
          runOnJS(hideToast)();
        }, duration);
      }
    } else {
      // Hide animation
      translateY.value = withTiming(
        position === 'top' ? -TOAST_HEIGHT : TOAST_HEIGHT,
        { duration: 250 }
      );
      opacity.value = withTiming(0, { duration: 250 });
      scale.value = withTiming(0.9, { duration: 250 });
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [visible, duration, position]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: translateY.value },
        { scale: scale.value },
      ],
      opacity: opacity.value,
    };
  });

  if (!visible && opacity.value === 0) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, animatedStyle, { [position]: 60 }]}>
      <View
        style={[
          styles.toast,
          {
            backgroundColor: config.backgroundColor,
          },
        ]}
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons
              name={config.icon}
              size={24}
              color="white"
            />
          </View>
          <Text style={[styles.message, { color: 'white' }]} numberOfLines={2}>
            {message}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={hideToast}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: SPACING.md,
    right: SPACING.md,
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    minHeight: 60,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 18,
  },
  closeButton: {
    padding: 4,
    marginLeft: SPACING.xs,
  },
});
