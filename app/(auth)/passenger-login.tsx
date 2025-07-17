import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Alert, Dimensions, SafeAreaView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { GoBangladeshLogo } from '../../components/GoBangladeshLogo';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Text } from '../../components/ui/Text';
import { useAuthStore } from '../../stores/authStore';
import { COLORS, SPACING } from '../../utils/constants';

const { width } = Dimensions.get('window');

export default function PassengerLogin() {
  const [identifier, setIdentifier] = useState(''); // Email or Mobile
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const { loginWithPassword, isLoading, error, clearError } = useAuthStore();

  const handleForgotPassword = () => {
    router.push('/(auth)/forgot-password');
  };

  const handleGoBack = () => {
    router.back();
  };

  const validateIdentifier = (input: string) => {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // Validate Bangladeshi mobile number format
    const phoneRegex = /^(\+?88)?01[3-9]\d{8}$/;
    
    return emailRegex.test(input) || phoneRegex.test(input);
  };

  const handleLogin = async () => {
    clearError();
    
    if (!validateIdentifier(identifier)) {
      Alert.alert('Error', 'Please enter a valid email address or Bangladeshi mobile number (e.g., user@example.com or 01712345678)');
      return;
    }

    if (!password) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    const success = await loginWithPassword(identifier, password);
    
    if (success) {
      router.replace('/(tabs)');
    }
  };



  return (
    <>
      <StatusBar style="dark" backgroundColor={COLORS.brand.background} translucent={false} />
      <SafeAreaView style={styles.container}>
        {/* Teal Glow Background */}
        <LinearGradient
          colors={['rgba(56, 193, 182, 0.5)', 'rgba(56, 193, 182, 0.1)', 'transparent']}
          locations={[0, 0.4, 0.7]}
          style={styles.glowBackground}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
        
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      
        <View style={styles.content}>
          <Animated.View entering={FadeInUp.duration(800)} style={styles.header}>
            <View style={styles.logoContainer}>
              <GoBangladeshLogo size={60} />
            </View>
            
            <Text variant="h3" style={styles.title}>Welcome Back!</Text>
            <Text style={styles.subtitle}>
              Sign in to your account
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(800).delay(200)}>
            <Card variant="elevated" style={styles.loginCard}>
              <View style={styles.loginContent}>
                <Input
                  label="Email or Mobile Number"
                  value={identifier}
                  onChangeText={setIdentifier}
                  placeholder="Enter your email or mobile number"
                  keyboardType="email-address"
                  icon="person"
                  autoCapitalize="none"
                />
                
                <Input
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  secureTextEntry={!showPassword}
                  icon="lock-closed"
                  rightIcon={showPassword ? "eye-off" : "eye"}
                  onRightIconPress={() => setShowPassword(!showPassword)}
                />

                <Button
                  title="Sign In"
                  onPress={handleLogin}
                  loading={isLoading}
                  disabled={!identifier.trim() || !password.trim()}
                  icon="arrow-forward"
                  size="medium"
                  fullWidth
                />

                {error && (
                  <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={16} color={COLORS.error} />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}
              </View>
            </Card>
          </Animated.View>

          <Animated.View 
            entering={FadeInDown.duration(800).delay(400)} 
            style={styles.bottomSection}
          >
            <TouchableOpacity 
              style={styles.forgotPasswordButton}
              onPress={handleForgotPassword}
            >
              <Text style={styles.forgotPasswordText}>
                Forgot Password?
              </Text>
            </TouchableOpacity>
            
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>
            
            <TouchableOpacity 
              style={styles.createAccountButton}
              onPress={() => router.push('/(auth)/passenger-registration')}
            >
              <Text style={styles.createAccountText}>
                Don't have an account?
              </Text>
              <Text style={styles.createAccountLink}>
                Register Now
              </Text>
            </TouchableOpacity>
            
            <View style={styles.organizationButton}>
              <Text style={styles.organizationText}>
                Need help with your account?
              </Text>
              <Text style={styles.organizationEmail}>
                info.gobangladesh@gmail.com
              </Text>
            </View>
          </Animated.View>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.brand.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    justifyContent: 'center',
    zIndex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  backButton: {
    position: 'absolute',
    left: SPACING.md,
    top: 48,
    padding: SPACING.sm,
    zIndex: 2,
  },
  logoContainer: {
    marginBottom: SPACING.sm,
  },
  title: {
    textAlign: 'center',
    color: COLORS.gray[900],
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    color: COLORS.gray[600],
    paddingHorizontal: SPACING.md,
    lineHeight: 20,
  },
  loginCard: {
    marginBottom: SPACING.md,
  },
  loginContent: {
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    backgroundColor: COLORS.error + '10',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.error + '30',
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    marginLeft: SPACING.sm,
    flex: 1,
  },
  bottomSection: {
    alignItems: 'center',
  },
  forgotPasswordButton: {
    paddingVertical: SPACING.sm,
  },
  forgotPasswordText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.md,
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
    fontWeight: '500',
  },
  createAccountButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
  },
  createAccountText: {
    fontSize: 16,
    textAlign: 'center',
    color: COLORS.gray[600],
    marginBottom: 4,
  },
  createAccountLink: {
    fontSize: 16,
    textAlign: 'center',
    color: COLORS.primary,
    fontWeight: '600',
  },
  organizationButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  organizationText: {
    fontSize: 14,
    textAlign: 'center',
    color: COLORS.gray[500],
    lineHeight: 18,
  },
  organizationEmail: {
    fontSize: 16,
    textAlign: 'center',
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 4,
  },
  glowBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#ffffff',
    zIndex: 0,
  },
});
