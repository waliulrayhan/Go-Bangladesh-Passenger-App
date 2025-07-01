import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Alert, Dimensions, SafeAreaView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Text } from '../../components/ui/Text';
import { mockApi } from '../../services/mockData';
import { useAuthStore } from '../../stores/authStore';
import { COLORS } from '../../utils/constants';

const { width } = Dimensions.get('window');

export default function StaffOptions() {
  const [identifier, setIdentifier] = useState(''); // Staff ID/Mobile Number
  
  const { sendOTP, isLoading, error, clearError } = useAuthStore();

  const handleGoBack = () => {
    router.back();
  };

  const validateIdentifier = (input: string) => {
    // Check if it's a mobile number
    const phoneRegex = /^(\+?88)?01[3-9]\d{8}$/;
    // Check if it's a staff ID (alphanumeric)
    const staffIdRegex = /^[A-Za-z0-9]{3,}$/;
    
    return phoneRegex.test(input) || staffIdRegex.test(input);
  };

  const handleSendOTP = async () => {
    clearError();
    
    if (!validateIdentifier(identifier)) {
      Alert.alert('Error', 'Please enter a valid Mobile Number or Staff ID');
      return;
    }

    try {
      // Lookup staff by identifier
      const staffLookup = await mockApi.getStaffByIdentifier(identifier);
      
      if (!staffLookup.found || !staffLookup.staff || !staffLookup.mobileNumber) {
        Alert.alert('Error', 'Staff member not found. Please check your Mobile Number or Staff ID.');
        return;
      }

      const success = await sendOTP(staffLookup.mobileNumber);
      
      if (success) {
        // Navigate to the dedicated OTP screen with staff info
        router.push({
          pathname: '/(auth)/staff-login-otp',
          params: {
            identifier,
            mobileNumber: staffLookup.mobileNumber,
            staffName: staffLookup.staff.name,
            staffType: staffLookup.staff.userType
          }
        });
      } else {
        Alert.alert('Error', error || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Staff lookup error:', error);
      Alert.alert('Error', 'Failed to lookup staff information. Please try again.');
    }
  };

  return (
    <>
      <StatusBar style="dark" backgroundColor={COLORS.gray[50]} translucent={false} />
      <SafeAreaView style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      
      <View style={styles.content}>
        <Animated.View entering={FadeInUp.duration(800)} style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="people" size={Math.min(width * 0.1, 40)} color={COLORS.primary} />
          </View>
          
          <Text style={styles.title}>Staff Login</Text>
          <Text style={styles.subtitle}>
            Enter your mobile number or staff ID to continue
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(800).delay(200)}>
          <Card variant="elevated" style={styles.loginCard}>
            <View style={styles.loginContent}>
              <Input
                label="Mobile Number or Staff ID"
                value={identifier}
                onChangeText={setIdentifier}
                placeholder="Enter mobile number or staff ID"
                keyboardType="default"
                icon="person-circle"
              />
              
              <Button
                title="Send OTP"
                onPress={handleSendOTP}
                loading={isLoading}
                disabled={!identifier.trim()}
                icon="send"
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
          <View style={styles.infoCard}>
            <View style={styles.infoIcon}>
              <Ionicons name="information-circle" size={24} color={COLORS.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Staff Access</Text>
              <Text style={styles.infoText}>
                This login is for bus drivers, helpers, and other staff members with operational access.
              </Text>
            </View>
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
    backgroundColor: COLORS.gray[50],
  },
  content: {
    flex: 1,
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  backButton: {
    position: 'absolute',
    left: 8,
    top: 48,
    padding: 8,
    zIndex: 1,
  },
  iconContainer: {
    width: Math.min(width * 0.2, 80),
    height: Math.min(width * 0.2, 80),
    borderRadius: Math.min(width * 0.1, 40),
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    paddingVertical: 4,
  },
  title: {
    fontSize: Math.min(width * 0.07, 28),
    fontWeight: 'bold',
    textAlign: 'center',
    color: COLORS.gray[900],
    marginBottom: 8,
  },
  subtitle: {
    fontSize: Math.min(width * 0.04, 16),
    textAlign: 'center',
    color: COLORS.gray[600],
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  loginCard: {
    marginBottom: 24,
  },
  loginContent: {
    padding: 12,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 12,
    backgroundColor: COLORS.error + '10',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.error + '30',
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  bottomSection: {
    alignItems: 'center',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary + '08',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary + '20',
    alignItems: 'flex-start',
  },
  infoIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.gray[600],
    lineHeight: 18,
  },
});
