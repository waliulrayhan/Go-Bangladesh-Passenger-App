import { Ionicons } from "@expo/vector-icons";
import React, { useEffect } from "react";
import {
    Modal,
    StyleSheet,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from "react-native";
import Animated, {
    FadeIn,
    FadeInDown,
    SlideInUp,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withSequence,
    withSpring,
    withTiming
} from "react-native-reanimated";
import { COLORS, SPACING } from "../utils/constants";
import { TYPOGRAPHY } from "../utils/fonts";
import { Text } from "./ui/Text";

interface PromoConfirmationModalProps {
  visible: boolean;
  promoCode: string;
  discount: string;
  onConfirm: () => void;
  onCancel: () => void;
}

// Confetti particle component
const ConfettiParticle: React.FC<{ delay: number; color: string; startX: number; shape?: 'circle' | 'square' }> = ({
  delay,
  color,
  startX,
  shape = 'square',
}) => {
  const translateY = useSharedValue(-50);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);

  useEffect(() => {
    // Fall from top to bottom with slight acceleration
    translateY.value = withDelay(
      delay,
      withTiming(650, { duration: 2500 })
    );
    // Horizontal drift with slight curve (zigzag effect)
    const drift = (Math.random() - 0.5) * 150;
    translateX.value = withDelay(
      delay,
      withTiming(drift, { duration: 2500 })
    );
    // Continuous rotation
    rotate.value = withDelay(
      delay,
      withRepeat(withTiming(360 * (Math.random() > 0.5 ? 1 : -1), { duration: 1000 + Math.random() * 500 }), -1)
    );
    // Scale animation with variation
    scale.value = withDelay(
      delay,
      withSequence(
        withSpring(0.8 + Math.random() * 0.4, { damping: 10 }),
        withTiming(0.6, { duration: 2200 })
      )
    );
    // Fade in and out
    opacity.value = withDelay(
      delay,
      withSequence(
        withTiming(1, { duration: 300 }),
        withDelay(1500, withTiming(0, { duration: 700 }))
      )
    );
  }, [delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.confetti,
        { 
          backgroundColor: color, 
          left: `${startX}%`,
          borderRadius: shape === 'circle' ? 5 : 2,
        },
        animatedStyle,
      ]}
    />
  );
};

// Celebration Icon Animation
const CelebrationIcon: React.FC = () => {
  const scale = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    scale.value = withSequence(
      withSpring(1.2, { damping: 8 }),
      withSpring(1, { damping: 10 })
    );
    rotate.value = withSequence(
      withTiming(-10, { duration: 100 }),
      withTiming(10, { duration: 100 }),
      withTiming(-10, { duration: 100 }),
      withTiming(0, { duration: 100 })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotate.value}deg` }],
  }));

  return (
    <Animated.View style={[styles.celebrationIconContainer, animatedStyle]}>
      <Ionicons name="gift" size={48} color={COLORS.white} />
    </Animated.View>
  );
};

// Sparkle Animation
const SparkleEffect: React.FC<{ delay: number; position: { top?: number; left?: number; right?: number } }> = ({
  delay,
  position,
}) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withSequence(
        withSpring(1, { damping: 10 }),
        withDelay(300, withTiming(0, { duration: 300 }))
      )
    );
    opacity.value = withDelay(
      delay,
      withSequence(
        withTiming(1, { duration: 200 }),
        withDelay(300, withTiming(0, { duration: 300 }))
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.sparkle, position, animatedStyle]}>
      <Ionicons name="star" size={16} color={COLORS.warning} />
    </Animated.View>
  );
};

export const PromoConfirmationModal: React.FC<PromoConfirmationModalProps> = ({
  visible,
  promoCode,
  discount,
  onConfirm,
  onCancel,
}) => {
  // Generate confetti colors
  const confettiColors = [
    COLORS.primary,
    COLORS.success,
    COLORS.warning,
    COLORS.error,
    "#FF6B9D",
    "#4ECDC4",
    "#FFD93D",
    "#95E1D3",
  ];

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
      onRequestClose={onCancel}
    >
      <TouchableWithoutFeedback onPress={onCancel}>
        <Animated.View entering={FadeIn.duration(200)} style={styles.overlay}>
          <TouchableWithoutFeedback>
            <Animated.View
              entering={SlideInUp.duration(400).springify()}
              style={styles.modalContainer}
            >
              {/* Confetti Particles */}
              {visible &&
                Array.from({ length: 50 }).map((_, index) => (
                  <ConfettiParticle
                    key={index}
                    delay={index * 20}
                    color={confettiColors[index % confettiColors.length]}
                    startX={(index * 7) % 100}
                    shape={index % 3 === 0 ? 'circle' : 'square'}
                  />
                ))}

              {/* Sparkle Effects */}
              {visible && (
                <>
                  <SparkleEffect delay={200} position={{ top: 20, left: 30 }} />
                  <SparkleEffect delay={300} position={{ top: 40, right: 40 }} />
                  <SparkleEffect delay={400} position={{ top: 60, left: 60 }} />
                  <SparkleEffect delay={250} position={{ top: 80, right: 30 }} />
                </>
              )}

              {/* Close Button */}
              {/* <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={COLORS.gray[400]} />
              </TouchableOpacity> */}

              {/* Celebration Icon */}
              {/* <View style={styles.iconSection}>
                <CelebrationIcon />
              </View> */}

              {/* Title */}
              <Animated.View entering={FadeInDown.duration(400).delay(200)}>
                <Text style={styles.title}>Apply Promo Code?</Text>
              </Animated.View>

              {/* Promo Details */}
              <Animated.View
                entering={FadeInDown.duration(400).delay(300)}
                style={styles.promoDetailsContainer}
              >
                <View style={styles.promoCodeContainer}>
                  <Ionicons name="pricetag" size={20} color={COLORS.primary} />
                  <Text style={styles.promoCode}>{promoCode}</Text>
                </View>

                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>{discount}</Text>
                </View>
              </Animated.View>

              {/* Message */}
              <Animated.View entering={FadeInDown.duration(400).delay(400)}>
                <Text style={styles.message}>
                  You're about to apply this promo code to your account. You can use it on your next trip!
                </Text>
              </Animated.View>

              {/* Benefits */}
              <Animated.View
                entering={FadeInDown.duration(400).delay(500)}
                style={styles.benefitsContainer}
              >
                <View style={styles.benefitRow}>
                  <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
                  <Text style={styles.benefitText}>Instant savings on your trip</Text>
                </View>
                <View style={styles.benefitRow}>
                  <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
                  <Text style={styles.benefitText}>Automatically applied at checkout</Text>
                </View>
              </Animated.View>

              {/* Buttons */}
              <Animated.View
                entering={FadeInDown.duration(400).delay(600)}
                style={styles.buttonContainer}
              >
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={onConfirm}
                  activeOpacity={0.8}
                >
                  <Ionicons name="gift-outline" size={20} color={COLORS.white} />
                  <Text style={styles.confirmButtonText}>Yes, Apply Promo!</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={onCancel}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelButtonText}>Maybe Later</Text>
                </TouchableOpacity>
              </Animated.View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 24,
    maxWidth: 400,
    width: "100%",
    elevation: 20,
    shadowColor: COLORS.gray[900],
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    overflow: "hidden",
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 10,
    padding: 4,
  },
  iconSection: {
    alignItems: "center",
    marginBottom: SPACING.lg,
  },
  celebrationIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  title: {
    ...TYPOGRAPHY.h5,
    fontSize: 24,
    fontWeight: "600",
    lineHeight: 32,
    color: COLORS.secondary,
    textAlign: "center",
    marginBottom: SPACING.lg,
  },
  promoDetailsContainer: {
    backgroundColor: COLORS.primary + "08",
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 2,
    borderColor: COLORS.primary + "20",
    borderStyle: "dashed",
  },
  promoCodeContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  promoCode: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.primary,
    letterSpacing: 1,
  },
  discountBadge: {
    alignSelf: "center",
    backgroundColor: COLORS.success,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 20,
  },
  discountText: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.white,
  },
  message: {
    ...TYPOGRAPHY.body,
    fontSize: 14,
    color: COLORS.gray[600],
    textAlign: "center",
    lineHeight: 20,
    marginBottom: SPACING.lg,
  },
  benefitsContainer: {
    backgroundColor: COLORS.success + "08",
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.xl,
    gap: SPACING.sm,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  benefitText: {
    ...TYPOGRAPHY.bodySmall,
    fontSize: 13,
    color: COLORS.gray[700],
    fontWeight: "500",
  },
  buttonContainer: {
    gap: SPACING.sm,
  },
  confirmButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 12,
    gap: SPACING.xs,
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  confirmButtonText: {
    ...TYPOGRAPHY.label,
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.white,
  },
  cancelButton: {
    backgroundColor: "transparent",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    ...TYPOGRAPHY.label,
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.gray[500],
  },
  confetti: {
    position: "absolute",
    width: 10,
    height: 10,
    borderRadius: 2,
    top: -50,
  },
  sparkle: {
    position: "absolute",
  },
});
