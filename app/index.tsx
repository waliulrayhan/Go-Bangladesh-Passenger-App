import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { SafeAreaView, StyleSheet, View } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { GoBangladeshLogo } from "../components/GoBangladeshLogo";
import { BubbleAnimation } from "../components/ui/BubbleAnimation";
import { Button } from "../components/ui/Button";
import { Text } from "../components/ui/Text";
import { useAuthStore } from "../stores/authStore";
import { COLORS, SPACING } from "../utils/constants";

export default function WelcomeScreen() {
  const { isAuthenticated, loadUserFromStorage } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  // Only redirect after initialization is complete
  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      console.log("🔄 [WELCOME] User is authenticated, redirecting to tabs...");
      router.replace("/(tabs)");
    }
  }, [isInitialized, isAuthenticated]);

  const initializeApp = async () => {
    setIsLoading(true);
    console.log("🚀 [WELCOME] Initializing app and checking authentication...");

    try {
      await loadUserFromStorage();
      console.log("✅ [WELCOME] Authentication check completed");
    } catch (error) {
      console.error("❌ [WELCOME] Error during app initialization:", error);
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  };

  const handleGetStarted = () => {
    router.push("/(auth)/passenger-login");
  };

  if (isLoading || !isInitialized) {
    return (
      <>
        <StatusBar
          style="light"
          backgroundColor="transparent"
          translucent={true}
        />
        <SafeAreaView style={styles.container}>
          <LinearGradient
            colors={[
              "rgba(74, 144, 226, 0.5)", // Blue at top
              "rgba(74, 144, 226, 0.2)",
              "transparent",
              "rgba(255, 138, 0, 0.2)", // Orange transition
              "rgba(255, 138, 0, 0.4)", // Orange at bottom
            ]}
            locations={[0, 0.2, 0.5, 0.8, 1]}
            style={styles.glowBackground}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />
          <View style={styles.bubbleContainer}>
            <BubbleAnimation bubbleCount={20} />
          </View>
          <View style={styles.loadingContainer}>
            <Animated.View entering={FadeInUp.duration(800)}>
              <GoBangladeshLogo size={80} />
            </Animated.View>
            <Animated.View entering={FadeInDown.duration(800).delay(200)}>
              <Text
                variant="body"
                color={COLORS.gray[600]}
                style={styles.loadingText}
              >
                Loading...
              </Text>
            </Animated.View>
          </View>
        </SafeAreaView>
      </>
    );
  }

  // Only show welcome screen if user is definitely not authenticated
  if (isInitialized && !isAuthenticated) {
    return (
      <>
        <StatusBar
          style="light"
          backgroundColor="transparent"
          translucent={true}
        />
        <SafeAreaView style={styles.container}>
          <LinearGradient
            colors={[
              "rgba(74, 144, 226, 0.5)", // Blue at top
              "rgba(74, 144, 226, 0.2)",
              "transparent",
              "rgba(255, 138, 0, 0.2)", // Orange transition
              "rgba(255, 138, 0, 0.4)", // Orange at bottom
            ]}
            locations={[0, 0.2, 0.5, 0.8, 1]}
            style={styles.glowBackground}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />
          <View style={styles.bubbleContainer}>
            <BubbleAnimation bubbleCount={25} />
          </View>
          <View style={styles.content}>
            <Animated.View
              entering={FadeInUp.duration(800).delay(200)}
              style={styles.header}
            >
              <View style={styles.logoContainer}>
                <GoBangladeshLogo size={120} />
              </View>
              <Text variant="h2" color={COLORS.primary} style={styles.title}>
                Go Bangladesh
              </Text>
              <Text
                variant="h6"
                color={COLORS.secondary}
                style={styles.subtitle}
              >
                One step toward a better future
              </Text>
              <Text
                variant="body"
                color={COLORS.gray[600]}
                style={styles.description}
              >
                Your convenient way to pay for transport with RFID card
                technology
              </Text>
            </Animated.View>

            <Animated.View
              entering={FadeInDown.duration(800).delay(400)}
              style={styles.buttonContainer}
            >
              <Button
                title="Get Started"
                onPress={handleGetStarted}
                variant="primary"
                size="large"
                icon="arrow-forward"
                fullWidth
              />
            </Animated.View>

            <Animated.View entering={FadeInUp.duration(800).delay(600)}>
              <Text
                variant="caption"
                color={COLORS.gray[600]}
                style={styles.note}
              >
                Safe • Secure • Friendly
              </Text>
            </Animated.View>
          </View>
        </SafeAreaView>
      </>
    );
  }

  // Return null if user is authenticated (will redirect to tabs)
  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.brand.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  loadingText: {
    marginTop: SPACING.md,
    textAlign: "center",
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
    justifyContent: "center",
    zIndex: 2,
  },
  header: {
    alignItems: "center",
    marginBottom: SPACING.xl * 2,
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.xs,
    padding: SPACING.sm,
  },
  title: {
    textAlign: "center",
    marginBottom: SPACING.xs,
  },
  subtitle: {
    textAlign: "center",
    marginBottom: SPACING.sm,
  },
  description: {
    textAlign: "center",
    paddingHorizontal: SPACING.sm,
    lineHeight: 24,
    padding: SPACING.md,
    borderRadius: 12,
    marginTop: SPACING.sm,
  },
  buttonContainer: {
    marginBottom: SPACING["5xl"],
  },
  note: {
    textAlign: "center",
    paddingHorizontal: SPACING.md,
    fontStyle: "italic",
    padding: SPACING.sm,
    borderRadius: 20,
    alignSelf: "center",
  },
  glowBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#ffffff",
    zIndex: 0,
  },
  bubbleContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
});
