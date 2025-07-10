import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { COLORS } from '../../utils/constants';
import { FONT_SIZES, FONT_WEIGHTS } from '../../utils/fonts';

export default function TabsLayout() {
  const { logout, user } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      router.dismissAll();
      router.replace('/');
    } catch (error) {
      console.error('Logout error:', error);
      // Force navigation even if logout fails
      router.dismissAll();
      router.replace('/');
    }
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.brand.blue,
        tabBarInactiveTintColor: COLORS.gray[500],
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopWidth: 1,
          borderTopColor: COLORS.gray[200],
          paddingTop: 8,
          paddingBottom: 8,
          height: 80,
          shadowOpacity: 0,
          elevation: 0,
        },
        tabBarLabelStyle: {
          fontSize: FONT_SIZES.sm,
          fontFamily: FONT_WEIGHTS.semiBold,
          marginTop: 4,
        },
        headerStyle: {
          backgroundColor: COLORS.brand.blue,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: COLORS.white,
        headerTitleStyle: {
          fontFamily: FONT_WEIGHTS.bold,
          fontSize: FONT_SIZES.lg,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          headerShown: false,
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarLabel: 'History',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
