import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="passenger-login" 
        options={{ 
          title: 'Student/Passenger Login',
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
          title: 'Passenger OTP Verification',
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="organization-selection" 
        options={{ 
          title: 'Select Organization',
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="bus-selection" 
        options={{ 
          title: 'Select Bus',
          headerShown: false 
        }} 
      />

      <Stack.Screen 
        name="staff-options" 
        options={{ 
          title: 'Staff Login',
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="staff-login-otp" 
        options={{ 
          title: 'Staff OTP Verification',
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="agent-organization-selection" 
        options={{ 
          title: 'Select Organization',
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="agent-login" 
        options={{ 
          title: 'Agent Login',
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="agent-otp" 
        options={{ 
          title: 'Agent OTP Verification',
          headerShown: false 
        }} 
      />
    </Stack>
  );
}
