import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="passenger-login" 
        options={{ 
          title: 'Student Login',
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="passenger-registration" 
        options={{ 
          title: 'Student Registration',
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="verify-registration" 
        options={{ 
          title: 'Verify Registration',
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="passenger-login-otp" 
        options={{ 
          title: 'OTP Verification',
          headerShown: false 
        }} 
      />
    </Stack>
  );
}
