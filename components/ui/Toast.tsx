import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { COLORS, SPACING } from "../../utils/constants";
import { Text } from "./Text";

export interface ToastProps {
  visible: boolean;
  message: string;
  type?: "success" | "error" | "warning" | "info";
  duration?: number;
  onHide?: () => void;
  position?: "top" | "bottom";
}

const TOAST_HEIGHT = 80;

export const Toast: React.FC<ToastProps> = ({
  visible,
  message,
  type = "info",
  duration = 1000,
  onHide,
  position = "top",
}) => {
  const translateY = useSharedValue(
    position === "top" ? -TOAST_HEIGHT : TOAST_HEIGHT
  );
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [messageHeight, setMessageHeight] = useState(60);

  // Calculate dynamic height based on message length and estimated line breaks
  const calculateToastHeight = (text: string) => {
    const baseHeight = 0; // Minimum height for icon and padding
    const charactersPerLine = 35; // Approximate characters per line based on toast width
    const lineHeight = 18; // Line height from styles
    const extraPadding = 16; // Additional padding for comfortable spacing

    const estimatedLines = Math.ceil(text.length / charactersPerLine);
    const contentHeight = Math.max(1, estimatedLines) * lineHeight;

    return Math.max(baseHeight, contentHeight + extraPadding + SPACING.sm * 2);
  };

  useEffect(() => {
    const calculatedHeight = calculateToastHeight(message);
    setMessageHeight(calculatedHeight);
  }, [message]);

  const getToastConfig = () => {
    switch (type) {
      case "success":
        return {
          backgroundColor: COLORS.success,
          icon: "checkmark-circle" as const,
          borderColor: COLORS.success,
        };
      case "error":
        return {
          backgroundColor: COLORS.error,
          icon: "alert-circle" as const,
          borderColor: COLORS.error,
        };
      case "warning":
        return {
          backgroundColor: "#f59e0b",
          icon: "warning" as const,
          borderColor: "#f59e0b",
        };
      case "info":
      default:
        return {
          backgroundColor: COLORS.primary,
          icon: "information-circle" as const,
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
      // Hide animation - use dynamic height for animation
      translateY.value = withTiming(
        position === "top" ? -messageHeight : messageHeight,
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
  }, [visible, duration, position, messageHeight]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }, { scale: scale.value }],
      opacity: opacity.value,
    };
  });

  if (!visible && opacity.value === 0) {
    return null;
  }

  return (
    <Animated.View
      style={[styles.container, animatedStyle, { [position]: 60 }]}
    >
      <View
        style={[
          styles.toast,
          {
            backgroundColor: config.backgroundColor,
            minHeight: messageHeight,
          },
        ]}
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name={config.icon} size={24} color="white" />
          </View>
          <Text style={[styles.message, { color: "white" }]}>{message}</Text>
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
    position: "absolute",
    left: SPACING.md,
    right: SPACING.md,
    zIndex: 9999,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    minHeight: 40,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.sm,
  },
  messageContainer: {
    flex: 1,
    justifyContent: "center",
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 18,
  },
  closeButton: {
    padding: 4,
    marginLeft: SPACING.xs,
  },
});
