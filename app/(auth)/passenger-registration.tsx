import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Dimensions, SafeAreaView, ScrollView, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Text } from '../../components/ui/Text';
import { useAuthStore } from '../../stores/authStore';
import { COLORS } from '../../utils/constants';

const { width } = Dimensions.get('window');

interface RegistrationForm {
  name: string;
  sex: 'male' | 'female' | '';
  mobile: string;
  email: string;
  cardNumber: string;
}

interface FormErrors {
  name?: string;
  sex?: string;
  mobile?: string;
  email?: string;
  cardNumber?: string;
}

export default function PassengerRegistration() {
  const [form, setForm] = useState<RegistrationForm>({
    name: '',
    sex: '',
    mobile: '',
    email: '',
    cardNumber: ''
  });  const [errors, setErrors] = useState<FormErrors>({});
  
  const { isLoading, sendOTP, checkCardExists } = useAuthStore();

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Name validation
    if (!form.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (form.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    // Sex validation
    if (!form.sex) {
      newErrors.sex = 'Please select your gender';
    }

    // Mobile validation
    const phoneRegex = /^(\+?88)?01[3-9]\d{8}$/;
    if (!form.mobile.trim()) {
      newErrors.mobile = 'Mobile number is required';
    } else if (!phoneRegex.test(form.mobile.trim())) {
      newErrors.mobile = 'Please enter a valid Bangladeshi mobile number';
    }

    // Email validation (optional)
    if (form.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email.trim())) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    // Card number validation
    if (!form.cardNumber.trim()) {
      newErrors.cardNumber = 'Card number is required';
    } else if (form.cardNumber.trim().length < 6) {
      newErrors.cardNumber = 'Card number must be at least 6 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      // Check if card exists in database
      const cardExists = await checkCardExists(form.cardNumber.trim());
      
      if (cardExists) {
        // Card exists, prompt to login
        Alert.alert(
          'Card Found',
          'This card number is already registered. Would you like to login instead?',
          [
            {
              text: 'Cancel',
              style: 'cancel'
            },
            {
              text: 'Login',
              onPress: () => {
                router.push({
                  pathname: '/(auth)/passenger-login',
                  params: { cardNumber: form.cardNumber.trim() }
                });
              }
            }
          ]
        );
      } else {
        // Card doesn't exist, proceed with registration
        // Send OTP to mobile number
        const otpSent = await sendOTP(form.mobile.trim());
        
        if (otpSent) {
          router.push({
            pathname: '/(auth)/verify-registration',
            params: {
              name: form.name.trim(),
              sex: form.sex,
              mobile: form.mobile.trim(),
              email: form.email.trim(),
              cardNumber: form.cardNumber.trim()
            }
          });
        } else {
          Alert.alert('Error', 'Failed to send OTP. Please try again.');
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  const updateForm = (field: keyof RegistrationForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.gray[50]} />
      
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
      </TouchableOpacity>
      
      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >        <Animated.View entering={FadeInUp.duration(800)} style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="person-add" size={32} color={COLORS.primary} />
          </View>
          <Text style={styles.title}>Student/Passenger Registration</Text>
          <Text style={styles.subtitle}>Create your travel card account</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(800).delay(200)}>
          <Card variant="elevated">
            <View style={styles.form}>
              <Input
                label="Full Name *"
                value={form.name}
                onChangeText={(value) => updateForm('name', value)}
                placeholder="Enter your full name"
                icon="person"
                error={errors.name}
              />              <View style={styles.genderSection}>
                <Text style={styles.genderLabel}>Gender *</Text>
                <View style={styles.genderButtons}>
                  <View style={{ flex: 1 }}>
                    <Button
                      title="Male"
                      onPress={() => updateForm('sex', 'male')}
                      variant={form.sex === 'male' ? 'primary' : 'outline'}
                      size="medium"
                      icon="male"
                      fullWidth
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Button
                      title="Female"
                      onPress={() => updateForm('sex', 'female')}
                      variant={form.sex === 'female' ? 'primary' : 'outline'}
                      size="medium"
                      icon="female"
                      fullWidth
                    />
                  </View>
                </View>
                {errors.sex && <Text style={styles.errorText}>{errors.sex}</Text>}
              </View>

              <Input
                label="Mobile Number *"
                value={form.mobile}
                onChangeText={(value) => updateForm('mobile', value)}
                placeholder="01XXXXXXXXX"
                keyboardType="phone-pad"
                icon="call"
                error={errors.mobile}
              />

              <Input
                label="Email (Optional)"
                value={form.email}
                onChangeText={(value) => updateForm('email', value)}
                placeholder="your.email@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                icon="mail"
                error={errors.email}
              />

              <Input
                label="Card Number *"
                value={form.cardNumber}
                onChangeText={(value) => updateForm('cardNumber', value)}
                placeholder="Enter your card number"
                keyboardType="numeric"
                icon="card"
                error={errors.cardNumber}
              />

              <View style={styles.infoBox}>
                <Ionicons name="information-circle" size={20} color={COLORS.primary} />
                <Text style={styles.infoText}>
                  Your initial balance will be set to ৳0. You can recharge your card later.
                </Text>
              </View>              <Button
                title="Next"
                onPress={handleNext}
                loading={isLoading}
                icon="arrow-forward"
                size="medium"
                fullWidth
              />            </View>
          </Card>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray[50],
  },
  content: {
    flex: 1,
  },  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 50 : 70,
  },header: {
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 0,
  },
  backButton: {
    position: 'absolute',
    left: 12,
    top: StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 30,
    padding: 8,
    zIndex: 1,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.gray[100],
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: COLORS.gray[900],
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: COLORS.gray[600],
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  formCard: {
    marginHorizontal: 0,
  },  form: {
    gap: 12,
    padding: 12,
  },
  genderSection: {
    marginBottom: 0,
  },
  genderLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[700],
    marginBottom: 10,
  },  genderButtons: {
    flexDirection: 'row',
    gap: 10,
    flex: 1,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: 8,
  },  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.primary + '10',
    padding: 12,
    borderRadius: 8,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.gray[700],
    lineHeight: 18,
  },
});
