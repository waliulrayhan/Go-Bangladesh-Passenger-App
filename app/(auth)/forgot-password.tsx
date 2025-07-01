import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, SafeAreaView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Text } from '../../components/ui/Text';
import { useAuthStore } from '../../stores/authStore';
import { COLORS, SPACING } from '../../utils/constants';

export default function ForgotPassword() {
  const [identifier, setIdentifier] = useState('');
  const [isEmailSent, setIsEmailSent] = useState(false);
  
  const { sendPasswordReset, isLoading, error, clearError } = useAuthStore();

  const handleGoBack = () => {
    router.back();
  };

  const validateIdentifier = (input: string) => {
    // Check if it's a mobile number
    const phoneRegex = /^(\+?88)?01[3-9]\d{8}$/;
    // Check if it's an email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    return phoneRegex.test(input) || emailRegex.test(input);
  };

  const handleSendResetLink = async () => {
    clearError();
    
    if (!validateIdentifier(identifier)) {
      Alert.alert('Error', 'Please enter a valid email address or mobile number');
      return;
    }

    const success = await sendPasswordReset(identifier);
    
    if (success) {
      setIsEmailSent(true);
      Alert.alert(
        'Reset Link Sent',
        `Password reset instructions have been sent to ${identifier}. Please check your email or SMS.`,
        [{ text: 'OK' }]
      );
    }
  };

  const handleContactOrganization = () => {
    router.push('/(auth)/organization-contacts');
  };

  if (isEmailSent) {
    return (
      <SafeAreaView style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        
        <View style={styles.content}>
          <Animated.View entering={FadeInUp.duration(800)} style={styles.successContainer}>
            <View style={styles.successIcon}>
              <Ionicons name="mail-outline" size={60} color={COLORS.success} />
            </View>
            
            <Text style={styles.successTitle}>Check Your Email</Text>
            <Text style={styles.successMessage}>
              We've sent password reset instructions to {identifier}
            </Text>
            
            <Text style={styles.helpText}>
              Didn't receive the email? Check your spam folder or try again in a few minutes.
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(800).delay(400)} style={styles.actions}>
            <Button
              title="Back to Login"
              onPress={handleGoBack}
              variant="primary"
              size="medium"
              fullWidth
            />
            
            <TouchableOpacity onPress={handleContactOrganization} style={styles.contactButton}>
              <Text style={styles.contactText}>Still need help? Contact your organization</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>
      
      <View style={styles.content}>
        <Animated.View entering={FadeInUp.duration(800)} style={styles.header}>
          <Text style={styles.title}>Forgot Password?</Text>
          <Text style={styles.subtitle}>
            Enter your email address or mobile number and we'll send you instructions to reset your password.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(800).delay(200)}>
          <Card variant="elevated" style={styles.formCard}>
            <View style={styles.formContent}>
              <Input
                label="Email or Mobile Number"
                value={identifier}
                onChangeText={setIdentifier}
                placeholder="Enter your email or mobile number"
                keyboardType="email-address"
                icon="mail"
                autoCapitalize="none"
              />
              
              {error && (
                <Animated.View entering={FadeInDown.duration(300)} style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={16} color={COLORS.error} />
                  <Text style={styles.errorText}>{error}</Text>
                </Animated.View>
              )}

              <Button
                title="Send Reset Link"
                onPress={handleSendResetLink}
                loading={isLoading}
                variant="primary"
                size="medium"
                fullWidth
                icon="mail"
              />
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(800).delay(400)} style={styles.helpSection}>
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>
          
          <TouchableOpacity onPress={handleContactOrganization} style={styles.organizationButton}>
            <Ionicons name="business" size={20} color={COLORS.primary} />
            <Text style={styles.organizationText}>Contact Your Organization</Text>
          </TouchableOpacity>
          
          <Text style={styles.helpNote}>
            If you're unable to reset your password, contact your institution's admin for assistance.
          </Text>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.brand.background,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: SPACING.md,
    zIndex: 1,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  backButtonText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    justifyContent: 'center',
    paddingTop: SPACING.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.gray[900],
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.gray[600],
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: SPACING.md,
  },
  formCard: {
    marginBottom: SPACING.md,
  },
  formContent: {
    gap: SPACING.sm,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.error + '10',
    padding: SPACING.sm,
    borderRadius: 8,
    gap: SPACING.xs,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    flex: 1,
  },
  helpSection: {
    alignItems: 'center',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.lg,
    width: '100%',
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
    fontWeight: '500',
  },
  organizationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '10',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: 8,
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  organizationText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '600',
  },
  helpNote: {
    fontSize: 14,
    color: COLORS.gray[500],
    textAlign: 'center',
    lineHeight: 20,
  },
  // Success state styles
  successContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.success + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.gray[900],
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: COLORS.gray[600],
    textAlign: 'center',
    marginBottom: SPACING.lg,
    lineHeight: 24,
  },
  helpText: {
    fontSize: 14,
    color: COLORS.gray[500],
    textAlign: 'center',
    lineHeight: 20,
  },
  actions: {
    gap: SPACING.sm,
  },
  contactButton: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  contactText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
});
