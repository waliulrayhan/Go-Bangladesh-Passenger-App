import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useState } from "react";
import {
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

import { GoBangladeshLogo } from "../../components/GoBangladeshLogo";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Text } from "../../components/ui/Text";
import { Toast } from "../../components/ui/Toast";
import { useToast } from "../../hooks/useToast";
import type { CardValidationResponse } from "../../services/api";
import { apiService } from "../../services/api";
import { COLORS, SPACING } from "../../utils/constants";

const { width } = Dimensions.get("window");

const ANIMATION_DELAYS = {
  HEADER: 800,
  FORM: 1000,
  BOTTOM: 1200,
} as const;

const CARD_CONSTRAINTS = {
  MIN_LENGTH: 8,
  MAX_LENGTH: 16,
  VALID_PATTERN: /^[A-Z0-9]{8,}$/,
} as const;

const MESSAGES = {
  INVALID_CARD: "Please enter a valid card number! (at least 8 characters)",
  CARD_NOT_AVAILABLE: "This card is not available for registration!",
  CARD_NOT_FOUND: "Card not found. Please check your card number and try again!",
  CARD_UNAVAILABLE_CONTACT: "This card is not available for registration. Please contact support if this is your card.",
  NETWORK_ERROR: "Unable to verify card. Please check your internet connection and try again!",
  CARD_AVAILABLE: "This card is available!",
} as const;

/**
 * PassengerRegistration Component
 * 
 * Handles the initial step of user registration:
 * - Card number validation and formatting
 * - API validation for card availability
 * - Navigation to personal info form
 * - Clean error handling and user feedback
 */

export default function PassengerRegistration() {
  // State management
  const [cardNumber, setCardNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // External hooks
  const { toast, showError, showSuccess, hideToast } = useToast();

  // Clear form when screen comes into focus (user navigates back)
  useFocusEffect(
    useCallback(() => {
      return () => {
        // Cleanup: Clear form when navigating away
        setCardNumber("");
        setIsLoading(false);
      };
    }, []) // Empty dependencies to prevent infinite loops
  );

  // Helper functions
  const validateCardNumber = (input: string): boolean => {
    return CARD_CONSTRAINTS.VALID_PATTERN.test(input.trim());
  };

  const formatCardNumber = (text: string): string => {
    return text.toUpperCase().replace(/[^A-Z0-9]/g, "");
  };

  const navigateBack = () => router.back();

  const navigateToLogin = () => {
    // Clear form before navigation to prevent UI shake
    setCardNumber("");
    setIsLoading(false);
    hideToast();
    router.push("/(auth)/passenger-login");
  };

  const navigateToPersonalInfo = (validationResponse: CardValidationResponse) => {
    router.push({
      pathname: "/(auth)/registration-personal-info",
      params: {
        cardNumber: cardNumber.trim(),
        organizationType: validationResponse.content!.organization.organizationType,
        organizationId: validationResponse.content!.organizationId,
        organizationName: validationResponse.content!.organization.name,
      },
    });
  };

  // Event handlers
  const handleCardNumberChange = (text: string) => {
    const formattedText = formatCardNumber(text);
    setCardNumber(formattedText);
  };

  const validateCardAvailability = async (): Promise<boolean> => {
    try {
      console.log("🔍 Checking card validity for:", cardNumber);
      const validationResponse = await apiService.checkCardValidityRegistration(cardNumber.trim());

      if (!validationResponse.isSuccess) {
        showError(validationResponse.message || MESSAGES.CARD_NOT_AVAILABLE);
        return false;
      }

      if (!validationResponse.content) {
        showError(MESSAGES.CARD_NOT_FOUND);
        return false;
      }

      if (validationResponse.message !== MESSAGES.CARD_AVAILABLE) {
        showError(MESSAGES.CARD_UNAVAILABLE_CONTACT);
        return false;
      }

      console.log("✅ Card is available for registration");
      console.log("🏢 Organization Type:", validationResponse.content.organization.organizationType);
      console.log("📋 Card Status:", validationResponse.content.status);
      console.log("💬 Message:", validationResponse.message);

      navigateToPersonalInfo(validationResponse);
      return true;
    } catch (error: any) {
      console.error("❌ Card validation error:", error);
      showError(MESSAGES.NETWORK_ERROR);
      return false;
    }
  };

  const handleProceed = async () => {
    if (!validateCardNumber(cardNumber)) {
      showError(MESSAGES.INVALID_CARD);
      return;
    }

    setIsLoading(true);
    await validateCardAvailability();
    setIsLoading(false);
  };

  // Render functions
  const renderHeader = () => (
    <Animated.View entering={FadeInUp.duration(ANIMATION_DELAYS.HEADER)} style={styles.header}>
      <View style={styles.logoContainer}>
        <GoBangladeshLogo size={70} />
      </View>

      <Text variant="h3" color={COLORS.secondary} style={styles.title}>
        User Registration
      </Text>
      <Text style={styles.subtitle}>
        Enter your card number to get started
      </Text>
    </Animated.View>
  );

  const renderRegistrationForm = () => (
    <Animated.View entering={FadeInDown.duration(ANIMATION_DELAYS.FORM).delay(200)}>
      <Card variant="elevated" style={styles.cardContainer}>
        <View style={styles.cardContent}>
          <View style={styles.iconContainer}>
            <Ionicons name="card-outline" size={32} color={COLORS.primary} />
          </View>

          <View style={styles.inputContainer}>
            <Input
              label="Card Number"
              value={cardNumber}
              onChangeText={handleCardNumberChange}
              placeholder="(e.g. ABCD1234)"
              keyboardType="default"
              icon="card-outline"
              maxLength={CARD_CONSTRAINTS.MAX_LENGTH}
              autoCapitalize="characters"
            />
          </View>

          <Text style={styles.helperText}>
            Enter the card number printed on your Go Bangladesh transport card
          </Text>

          <Button
            title="Proceed"
            onPress={handleProceed}
            loading={isLoading}
            disabled={!cardNumber.trim()}
            icon="arrow-forward-outline"
            size="medium"
            fullWidth
          />
        </View>
      </Card>
    </Animated.View>
  );

  const renderBottomSection = () => (
    <Animated.View
      entering={FadeInDown.duration(ANIMATION_DELAYS.BOTTOM).delay(400)}
      style={styles.bottomSection}
    >
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>OR</Text>
        <View style={styles.dividerLine} />
      </View>

      <TouchableOpacity style={styles.loginButton} onPress={navigateToLogin}>
        <Text style={styles.loginText}>
          Already have an account?{" "}
        </Text>
        <Text style={styles.loginLink}>Sign In</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <>
      <StatusBar style="light" backgroundColor="transparent" translucent={true} />
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={[
            "rgba(74, 144, 226, 0.5)",
            "rgba(74, 144, 226, 0.2)",
            "transparent",
            "rgba(255, 138, 0, 0.2)",
            "rgba(255, 138, 0, 0.4)",
          ]}
          locations={[0, 0.2, 0.5, 0.8, 1]}
          style={styles.glowBackground}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />

        <TouchableOpacity style={styles.backButton} onPress={navigateBack}>
          <Ionicons name="arrow-back" size={24} color={COLORS.gray[700]} />
        </TouchableOpacity>

        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
            overScrollMode="never"
            scrollEventThrottle={16}
            removeClippedSubviews={false}
            maintainVisibleContentPosition={{
              minIndexForVisible: 0,
              autoscrollToTopThreshold: 0,
            }}
            automaticallyAdjustContentInsets={false}
            contentInsetAdjustmentBehavior="never"
          >
            {renderHeader()}
            {renderRegistrationForm()}
            {renderBottomSection()}
          </ScrollView>
        </KeyboardAvoidingView>

        <Toast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          onHide={hideToast}/>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.brand.background,
  },
  keyboardAvoidingView: {
    flex: 1,
    zIndex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.md,
    paddingTop: 80, // Space for back button
    paddingBottom: SPACING.lg,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    justifyContent: "center",
    zIndex: 1,
  },
  header: {
    alignItems: "center",
    marginBottom: SPACING.lg,
    marginTop: SPACING.xl,
  },
  backButton: {
    position: "absolute",
    left: SPACING.md,
    top: 60, // Increased for translucent status bar
    padding: SPACING.sm,
    zIndex: 2,
  },
  logoContainer: {
    marginBottom: SPACING.sm,
  },
  title: {
    textAlign: "center",
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
    color: COLORS.gray[600],
    paddingHorizontal: SPACING.md,
    lineHeight: 20,
  },
  cardContainer: {
    marginBottom: SPACING.md,
  },
  cardContent: {
    padding: SPACING.md,
    alignItems: "center",
    gap: SPACING.md,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.brand.blue_subtle,
    alignItems: "center",
    justifyContent: "center",
  },
  inputContainer: {
    width: "100%",
    alignSelf: "stretch",
  },
  helperText: {
    fontSize: 14,
    color: COLORS.gray[600],
    textAlign: "center",
    lineHeight: 18,
  },
  bottomSection: {
    alignItems: "center",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: SPACING["xl"],
    paddingHorizontal: SPACING.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.gray[300],
  },
  dividerText: {
    marginHorizontal: SPACING.md,
    fontSize: 14,
    color: COLORS.gray[500],
    fontWeight: "500",
  },
  loginButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    alignItems: "center",
  },
  loginText: {
    fontSize: 16,
    textAlign: "center",
    color: COLORS.gray[600],
    marginBottom: 4,
  },
  loginLink: {
    fontSize: 16,
    textAlign: "center",
    color: COLORS.primary,
    fontWeight: "600",
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
});

