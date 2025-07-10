import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { apiService } from '../services/api';
import { COLORS, SPACING } from '../utils/constants';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Text } from './ui/Text';

export function TestRegistrationAPI() {
  const [cardNumber, setCardNumber] = useState('015WR6');
  const [mobileNumber, setMobileNumber] = useState('01303088826');
  const [otp, setOtp] = useState('123456');
  const [loading, setLoading] = useState(false);

  const testCardValidation = async () => {
    setLoading(true);
    try {
      const result = await apiService.checkCardValidity(cardNumber);
      Alert.alert('Card Validation Result', result.message);
      console.log('Card validation result:', result);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Card validation failed');
      console.error('Card validation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const testSendOTP = async () => {
    setLoading(true);
    try {
      await apiService.sendOTP(mobileNumber);
      Alert.alert('Success', 'OTP sent successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send OTP');
      console.error('Send OTP error:', error);
    } finally {
      setLoading(false);
    }
  };

  const testVerifyOTP = async () => {
    setLoading(true);
    try {
      await apiService.verifyOTP(mobileNumber, otp);
      Alert.alert('Success', 'OTP verified successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'OTP verification failed');
      console.error('Verify OTP error:', error);
    } finally {
      setLoading(false);
    }
  };

  const testRegistration = async () => {
    setLoading(true);
    try {
      const registrationData = {
        Name: 'Test User',
        MobileNumber: mobileNumber,
        EmailAddress: 'test@example.com',
        Gender: 'male',
        Address: 'Test Address',
        DateOfBirth: '2001-11-03 00:00:00.0000000',
        Password: '12345678',
        UserType: 'Public',
        OrganizationId: '1', // Fixed value as required by API
        CardNumber: cardNumber
      };
      
      await apiService.registerPassenger(registrationData);
      Alert.alert('Success', 'Registration completed successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Registration failed');
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>API Test Component</Text>
      
      <Input
        label="Card Number"
        value={cardNumber}
        onChangeText={setCardNumber}
        placeholder="Enter card number"
      />
      
      <Input
        label="Mobile Number"
        value={mobileNumber}
        onChangeText={setMobileNumber}
        placeholder="Enter mobile number"
      />
      
      <Input
        label="OTP"
        value={otp}
        onChangeText={setOtp}
        placeholder="Enter OTP"
      />
      
      <Button
        title="Test Card Validation"
        onPress={testCardValidation}
        loading={loading}
        fullWidth
      />
      
      <Button
        title="Test Send OTP"
        onPress={testSendOTP}
        loading={loading}
        fullWidth
      />
      
      <Button
        title="Test Verify OTP"
        onPress={testVerifyOTP}
        loading={loading}
        fullWidth
      />
      
      <Button
        title="Test Registration"
        onPress={testRegistration}
        loading={loading}
        fullWidth
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: SPACING.md,
    gap: SPACING.md,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.gray[900],
    marginBottom: SPACING.md,
  },
});
