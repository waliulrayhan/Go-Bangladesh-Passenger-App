import { Link, Stack } from "expo-router";
import { StyleSheet, View, Dimensions } from "react-native";
import { StatusBar } from "expo-status-bar";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  withSpring,
  Easing,
} from "react-native-reanimated";
import { useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "../components/ui/Text";
import { Button } from "../components/ui/Button";
import { COLORS } from "../utils/constants";
import { BubbleAnimation } from "../components/ui/BubbleAnimation";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function NotFoundScreen() {
  // Animation values
  const iconScale = useSharedValue(0);
  const iconRotation = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(30);
  const subtitleOpacity = useSharedValue(0);
  const subtitleTranslateY = useSharedValue(30);
  const buttonOpacity = useSharedValue(0);
  const buttonTranslateY = useSharedValue(30);
  const containerOpacity = useSharedValue(0);

  useEffect(() => {
    // Staggered entrance animations
    containerOpacity.value = withTiming(1, { duration: 300 });

    // Icon animation - bounce in with rotation
    iconScale.value = withDelay(
      200,
      withSpring(1, {
        damping: 10,
        stiffness: 100,
      })
    );

    // Continuous floating animation for icon
    iconRotation.value = withDelay(
      1000,
      withRepeat(
        withSequence(
          withTiming(-5, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
          withTiming(5, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        false
      )
    );

    // Title animation
    setTimeout(() => {
      titleOpacity.value = withTiming(1, { duration: 600 });
      titleTranslateY.value = withSpring(0, { damping: 8, stiffness: 100 });
    }, 400);

    // Subtitle animation
    setTimeout(() => {
      subtitleOpacity.value = withTiming(1, { duration: 600 });
      subtitleTranslateY.value = withSpring(0, { damping: 8, stiffness: 100 });
    }, 600);

    // Button animation
    setTimeout(() => {
      buttonOpacity.value = withTiming(1, { duration: 600 });
      buttonTranslateY.value = withSpring(0, { damping: 8, stiffness: 100 });
    }, 800);
  }, []);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: iconScale.value },
      { rotate: `${iconRotation.value}deg` },
    ],
  }));

  const animatedTitleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const animatedSubtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
    transform: [{ translateY: subtitleTranslateY.value }],
  }));

  const animatedButtonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ translateY: buttonTranslateY.value }],
  }));

  return (
    <>
      <StatusBar style="dark" backgroundColor={COLORS.gray[50]} />
      <Stack.Screen
        options={{
          title: "Page Not Found",
          headerShown: false,
        }}
      />

      <Animated.View style={[styles.container, animatedContainerStyle]}>
        <BubbleAnimation />

        {/* Main Content */}
        <View style={styles.content}>
          {/* Animated Icon */}
          <Animated.View style={[styles.iconContainer, animatedIconStyle]}>
            <View style={styles.iconBackground}>
              <Ionicons
                name="help-circle-outline"
                size={80}
                color={COLORS.primary}
              />
            </View>
          </Animated.View>

          {/* Error Code */}
          <View style={styles.errorCodeContainer}>
            <Text style={styles.errorCode}>404</Text>
          </View>

          {/* Title */}
          <Animated.View style={animatedTitleStyle}>
            <Text style={styles.title}>Oops! Page Not Found</Text>
          </Animated.View>

          {/* Subtitle */}
          <Animated.View style={animatedSubtitleStyle}>
            <Text style={styles.subtitle}>
              The page you're looking for seems to have taken a detour. Don't
              worry, let's get you back on track!
            </Text>
          </Animated.View>

          {/* Action Button */}
          <Animated.View style={[styles.buttonContainer, animatedButtonStyle]}>
            <Link href="/" asChild>
              <Button
                title="Take Me Home"
                variant="primary"
                icon="home-outline"
                iconPosition="left"
                size="large"
                onPress={() => {}}
              />
            </Link>
          </Animated.View>
        </View>

        {/* Decorative Elements */}
        <View style={styles.decorativeElements}>
          <View style={[styles.decorativeCircle, styles.circle1]} />
          <View style={[styles.decorativeCircle, styles.circle2]} />
          <View style={[styles.decorativeCircle, styles.circle3]} />
        </View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray[50],
    position: "relative",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
    zIndex: 2,
  },
  iconContainer: {
    marginBottom: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.brand.blue_subtle,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  errorCodeContainer: {
    marginBottom: 16,
  },
  errorCode: {
    fontSize: 33,
    fontWeight: "bold",
    color: COLORS.brand.orange,
    textAlign: "center",
    opacity: 0.8,
    letterSpacing: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.gray[900],
    textAlign: "center",
    marginBottom: 12,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.gray[600],
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 40,
    paddingHorizontal: 16,
    maxWidth: 320,
  },
  buttonContainer: {
    marginBottom: 24,
    width: "100%",
    maxWidth: 280,
  },
  alternativeActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  alternativeLink: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  alternativeLinkText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "500",
  },
  divider: {
    fontSize: 14,
    color: COLORS.gray[400],
    marginHorizontal: 8,
  },
  decorativeElements: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  decorativeCircle: {
    position: "absolute",
    borderRadius: 999,
    opacity: 0.05,
  },
  circle1: {
    width: 200,
    height: 200,
    backgroundColor: COLORS.primary,
    top: -50,
    right: -50,
  },
  circle2: {
    width: 150,
    height: 150,
    backgroundColor: COLORS.brand.orange,
    bottom: 100,
    left: -30,
  },
  circle3: {
    width: 100,
    height: 100,
    backgroundColor: COLORS.primary,
    top: SCREEN_HEIGHT * 0.3,
    right: 30,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  linkText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: "600",
  },
});

