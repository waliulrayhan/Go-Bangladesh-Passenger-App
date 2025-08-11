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
        name="registration-personal-info" 
        options={{ 
          title: 'Personal Information',
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
        name="forgot-password" 
        options={{ 
          title: 'Forgot Password',
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="reset-password" 
        options={{ 
          headerShown: false,
          title: "Reset Password",
          gestureEnabled: false, // Disable swipe gestures
          headerBackVisible: false, // Hide back button if header was shown
        }} 
      />
      <Stack.Screen 
        name="verify-account-deletion" 
        options={{ 
          headerShown: false,
          title: "Verify Account Deletion"
        }}
      />
      <Stack.Screen 
        name="change-password" 
        options={{ 
          headerShown: false,
          title: "Change Password"
        }} 
      />
    </Stack>
  );
}
