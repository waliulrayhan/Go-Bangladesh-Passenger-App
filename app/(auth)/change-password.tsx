import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Alert, SafeAreaView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Text } from '../../components/ui/Text';
import { useAuthStore } from '../../stores/authStore';
import { COLORS, SPACING } from '../../utils/constants';

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
      <StatusBar style="dark" backgroundColor={COLORS.brand.background} translucent={false} />
      <SafeAreaView style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        
        <View style={styles.content}>
          <Animated.View entering={FadeInUp.duration(800)} style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="key" size={40} color={COLORS.primary} />
            </View>
            <Text style={styles.title}>Change Password</Text>
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
                  rightIcon={showOldPassword ? "eye-off" : "eye"}
                  onRightIconPress={() => setShowOldPassword(!showOldPassword)}
                />

                <Input
                  label="New Password"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Enter new password"
                  secureTextEntry={!showNewPassword}
                  rightIcon={showNewPassword ? "eye-off" : "eye"}
                  onRightIconPress={() => setShowNewPassword(!showNewPassword)}
                />

                <Input
                  label="Confirm New Password"
                  value={confirmNewPassword}
                  onChangeText={setConfirmNewPassword}
                  placeholder="Confirm new password"
                  secureTextEntry={!showConfirmPassword}
                  rightIcon={showConfirmPassword ? "eye-off" : "eye"}
                  onRightIconPress={() => setShowConfirmPassword(!showConfirmPassword)}
                />

                {error && (
                  <Animated.View 
                    entering={FadeInUp.duration(300)} 
                    style={styles.errorContainer}
                  >
                    <Ionicons name="alert-circle" size={16} color={COLORS.error} />
                    <Text style={styles.errorText}>{error}</Text>
                  </Animated.View>
                )}

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
                  variant="primary"
                  disabled={!oldPassword || !newPassword || !confirmNewPassword || newPassword !== confirmNewPassword || newPassword.length < 6}
                />
              </View>
            </Card>
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
  backButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginTop: SPACING.sm,
  },
  backButtonText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.gray[900],
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.gray[600],
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
  },
  formCard: {
    marginBottom: SPACING.lg,
  },
  formContent: {
    padding: SPACING.lg,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.error + '10',
    padding: SPACING.sm,
    borderRadius: 8,
    marginBottom: SPACING.md,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.error,
    marginLeft: SPACING.xs,
    flex: 1,
    fontWeight: '500',
  },
  passwordRequirements: {
    backgroundColor: COLORS.gray[50],
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.lg,
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
});
