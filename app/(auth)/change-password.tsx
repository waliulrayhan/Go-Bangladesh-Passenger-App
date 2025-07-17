import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
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

export default function ChangePassword() {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const { changePassword, isLoading, error, clearError } = useAuthStore();

  const handleGoBack = () => {
    router.back();
  };

  const validatePassword = (password: string) => {
    if (password.length < 6) {
      return 'Password must be at least 6 characters long';
    }
    return null;
  };

  const handleChangePassword = async () => {
    clearError();
    
    // Validate inputs
    if (!oldPassword.trim()) {
      Alert.alert('Error', 'Please enter your current password');
      return;
    }
    
    if (!newPassword.trim()) {
      Alert.alert('Error', 'Please enter a new password');
      return;
    }
    
    if (!confirmNewPassword.trim()) {
      Alert.alert('Error', 'Please confirm your new password');
      return;
    }
    
    // Validate new password
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      Alert.alert('Error', passwordError);
      return;
    }
    
    // Check if passwords match
    if (newPassword !== confirmNewPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }
    
    // Check if old and new password are the same
    if (oldPassword === newPassword) {
      Alert.alert('Error', 'New password must be different from your current password');
      return;
    }

    const result = await changePassword(oldPassword, newPassword, confirmNewPassword);
    
    if (result.success) {
      Alert.alert(
        'Password Changed Successfully',
        'Your password has been updated successfully.',
        [
          {
            text: 'OK',
            onPress: () => {
              router.back();
            }
          }
        ]
      );
    } else {
      Alert.alert('Error', result.message);
    }
  };

  return (
    <>
      <SafeAreaView style={styles.container}>
        {/* Purple Glow Background */}
        <LinearGradient
          colors={['rgba(173, 109, 244, 0.5)', 'rgba(173, 109, 244, 0.1)', 'transparent']}
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
            
            <Text variant="h3" style={styles.title}>Change Password</Text>
            <Text style={styles.subtitle}>
              Update your account password for better security
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(800).delay(200)}>
            <Card variant="elevated" style={styles.formCard}>
              <View style={styles.formContent}>
                <Input
                  label="Current Password"
                  value={oldPassword}
                  onChangeText={setOldPassword}
                  placeholder="Enter your current password"
                  secureTextEntry={!showOldPassword}
                  icon="lock-closed"
                  rightIcon={showOldPassword ? "eye-off" : "eye"}
                  onRightIconPress={() => setShowOldPassword(!showOldPassword)}
                />

                <Input
                  label="New Password"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Enter new password"
                  secureTextEntry={!showNewPassword}
                  icon="lock-closed"
                  rightIcon={showNewPassword ? "eye-off" : "eye"}
                  onRightIconPress={() => setShowNewPassword(!showNewPassword)}
                />

                <Input
                  label="Confirm New Password"
                  value={confirmNewPassword}
                  onChangeText={setConfirmNewPassword}
                  placeholder="Confirm new password"
                  secureTextEntry={!showConfirmPassword}
                  icon="lock-closed"
                  rightIcon={showConfirmPassword ? "eye-off" : "eye"}
                  onRightIconPress={() => setShowConfirmPassword(!showConfirmPassword)}
                />

                <View style={styles.passwordRequirements}>
                  <Text style={styles.requirementsTitle}>Password Requirements:</Text>
                  <View style={styles.requirement}>
                    <Ionicons 
                      name={newPassword.length >= 6 ? "checkmark-circle" : "ellipse-outline"} 
                      size={16} 
                      color={newPassword.length >= 6 ? COLORS.success : COLORS.gray[400]} 
                    />
                    <Text style={[
                      styles.requirementText,
                      { color: newPassword.length >= 6 ? COLORS.success : COLORS.gray[600] }
                    ]}>
                      At least 6 characters
                    </Text>
                  </View>
                  <View style={styles.requirement}>
                    <Ionicons 
                      name={newPassword === confirmNewPassword && newPassword ? "checkmark-circle" : "ellipse-outline"} 
                      size={16} 
                      color={newPassword === confirmNewPassword && newPassword ? COLORS.success : COLORS.gray[400]} 
                    />
                    <Text style={[
                      styles.requirementText,
                      { color: newPassword === confirmNewPassword && newPassword ? COLORS.success : COLORS.gray[600] }
                    ]}>
                      Passwords match
                    </Text>
                  </View>
                </View>

                <Button
                  title="Change Password"
                  onPress={handleChangePassword}
                  loading={isLoading}
                  disabled={!oldPassword || !newPassword || !confirmNewPassword || newPassword !== confirmNewPassword || newPassword.length < 6}
                  icon="checkmark"
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
            <View style={styles.helpSection}>
              <Text style={styles.helpText}>
                Need help with your password?
              </Text>
              <Text style={styles.helpEmail}>
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
  formCard: {
    marginBottom: SPACING.md,
  },
  formContent: {
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
  passwordRequirements: {
    backgroundColor: COLORS.gray[50],
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.sm,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: SPACING.sm,
  },
  requirement: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  requirementText: {
    fontSize: 14,
    marginLeft: SPACING.xs,
    fontWeight: '500',
  },
  bottomSection: {
    alignItems: 'center',
  },
  helpSection: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  helpText: {
    fontSize: 14,
    textAlign: 'center',
    color: COLORS.gray[500],
    lineHeight: 18,
  },
  helpEmail: {
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
