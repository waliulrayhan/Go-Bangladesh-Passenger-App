import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
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
}

const TOAST_HEIGHT = 60;

export const Toast: React.FC<ToastProps> = ({
  visible,
  message,
  type = "info",
  duration = 2000, // Default 2 seconds
  onHide,
}) => {
  const translateY = useSharedValue(TOAST_HEIGHT);
  const opacity = useSharedValue(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const getToastConfig = () => {
    switch (type) {
      case "success":
        return {
          backgroundColor: COLORS.success,
          icon: "checkmark-circle" as const,
        };
      case "error":
        return {
          backgroundColor: COLORS.error,
          icon: "alert-circle" as const,
        };
      case "warning":
        return {
          backgroundColor: "#f59e0b",
          icon: "warning" as const,
        };
      case "info":
      default:
        return {
          backgroundColor: COLORS.primary,
          icon: "information-circle" as const,
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
      // Show animation - slide up from bottom
      translateY.value = withSpring(0, {
        damping: 15,
        stiffness: 150,
      });
      opacity.value = withTiming(1, { duration: 300 });

      // Auto hide after duration
      if (duration > 0) {
        timeoutRef.current = setTimeout(() => {
          runOnJS(hideToast)();
        }, duration);
      }
    } else {
      // Hide animation - slide down to bottom
      translateY.value = withTiming(TOAST_HEIGHT, { duration: 250 });
      opacity.value = withTiming(0, { duration: 250 });
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [visible, duration]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
      opacity: opacity.value,
    };
  });

  if (!visible && opacity.value === 0) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <View
        style={[
          styles.toast,
          {
            backgroundColor: config.backgroundColor,
          },
        ]}
      >
        <View style={styles.iconContainer}>
          <Ionicons name={config.icon} size={20} color="white" />
        </View>
        <Text style={styles.message}>{message}</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 40, // Fixed bottom position
    left: SPACING.md,
    right: SPACING.md,
    zIndex: 9999,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    minHeight: TOAST_HEIGHT,
    elevation: 5, // Android shadow
    shadowColor: "#000", // iOS shadow
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  iconContainer: {
    marginRight: SPACING.sm,
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: "white",
    lineHeight: 18,
  },
});

