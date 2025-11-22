import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Tabs, useRouter } from "expo-router";
import { useEffect } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { CustomHeader } from "../../components/ui/CustomHeader";
import { useStatusBar } from "../../hooks/useStatusBar";
import { useAuthStore } from "../../stores/authStore";
import { useNotificationStore } from "../../stores/notificationStore";
import { COLORS } from "../../utils/constants";
import { FONT_SIZES, FONT_WEIGHTS } from "../../utils/fonts";

export default function TabsLayout() {
  // Status bar configuration for consistent appearance across all tabs
  // This ensures the status bar is properly configured on all platforms
  useStatusBar({
    backgroundColor: COLORS.brand.blue,
    barStyle: 'light-content',
    translucent: false,
    hidden: false,
  });

  const { user, isAuthenticated } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const router = useRouter();

  // Note: Navigation is now handled by the main layout to prevent conflicts
  // Redirect to welcome if user is not authenticated
  useEffect(() => {
    if (!isAuthenticated || !user) {
      console.log(
        "🔄 [TABS] User not authenticated - main layout will handle navigation"
      );
      // Let the main layout handle navigation to prevent conflicts
    }
  }, [isAuthenticated, user]);

  // If user is not authenticated, don't render the tabs at all
  // This forces Expo Router to show the fallback route (welcome screen)
  if (!isAuthenticated || !user) {
    console.log("🚫 [TABS] Not rendering tabs - user not authenticated");
    return null; // This will cause Expo Router to show the index route instead
  }

  console.log("✅ [TABS] Rendering tabs for authenticated user");

  // Custom header component function
  const renderCustomHeader = () => {
    return (
      <CustomHeader 
        user={user}
        onProfilePress={() => router.push("/(tabs)/profile")}
        onNotificationPress={() => router.push("/(tabs)/notifications")}
        unreadCount={unreadCount}
        showNotificationBell={true}
      />
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[
          "rgba(74, 144, 226, 0.5)", // Blue at top
          "rgba(74, 144, 226, 0.2)",
          "transparent",
          "rgba(255, 138, 0, 0.2)", // Orange transition
          "rgba(255, 138, 0, 0.4)", // Orange at bottom
        ]}
        locations={[0, 0.2, 0.5, 0.8, 1]}
        style={styles.glowBackground}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

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
            header: renderCustomHeader,
            headerShown: true,
            headerStyle: {
              backgroundColor: COLORS.brand.blue,
            },
            tabBarLabel: "Home",
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? "home" : "home-outline"}
                size={size}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: "History",
            tabBarLabel: "History",
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? "time" : "time-outline"}
                size={size}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="map"
          options={{
            title: "Map",
            headerShown: true, // Show header like History page
            tabBarLabel: "Map",
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? "map" : "map-outline"}
                size={size}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="view"
          options={{
            title: "Map Preview",
            headerShown: true,
            href: null, // Hide from tab bar
            headerLeft: ({ tintColor }) => (
              <TouchableOpacity
                onPress={() => router.push("/(tabs)/map")}
                style={{
                  marginLeft: 15,
                  marginTop: 4,
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingHorizontal: 4,
                }}
              >
                <Ionicons
                  name="arrow-back"
                  size={24}
                  color={tintColor}
                />
              </TouchableOpacity>
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarLabel: "Profile",
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? "person" : "person-outline"}
                size={size}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="notifications"
          options={{
            title: "Notifications",
            headerShown: true,
            href: null, // Hide from tab bar
            headerLeft: ({ tintColor }) => (
              <TouchableOpacity
                onPress={() => router.push("/(tabs)/index")}
                style={{
                  marginLeft: 15,
                  marginTop: 4,
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingHorizontal: 4,
                }}
              >
                <Ionicons
                  name="arrow-back"
                  size={24}
                  color={tintColor}
                />
              </TouchableOpacity>
            ),
            headerRight: ({ tintColor }) => (
              <View style={{ marginRight: 0 }}>
                {/* This will be dynamically shown/hidden from the notifications page */}
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="promo"
          options={{
            title: "Promo",
            headerShown: true,
            href: null, // Hide from tab bar
            headerLeft: ({ tintColor }) => (
              <TouchableOpacity
                onPress={() => router.push("/(tabs)/profile")}
                style={{
                  marginLeft: 15,
                  marginTop: 4,
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingHorizontal: 4,
                }}
              >
                <Ionicons
                  name="arrow-back"
                  size={24}
                  color={tintColor}
                />
              </TouchableOpacity>
            ),
          }}
        />
        <Tabs.Screen
          name="promo-history"
          options={{
            title: "Promo History",
            headerShown: true,
            href: null, // Hide from tab bar
            headerLeft: ({ tintColor }) => (
              <TouchableOpacity
                onPress={() => router.push("/(tabs)/profile")}
                style={{
                  marginLeft: 15,
                  marginTop: 4,
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingHorizontal: 4,
                }}
              >
                <Ionicons
                  name="arrow-back"
                  size={24}
                  color={tintColor}
                />
              </TouchableOpacity>
            ),
          }}
        />
        <Tabs.Screen
          name="change-password"
          options={{
            title: "Change Password",
            headerShown: false,
            href: null, // Hide from tab bar
            tabBarStyle: { display: "none" }, // Hide entire tab bar
          }}
        />
        <Tabs.Screen
          name="verify-account-deletion"
          options={{
            title: "Verify Account Deletion",
            headerShown: false,
            href: null, // Hide from tab bar
            tabBarStyle: { display: "none" }, // Hide entire tab bar
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
    position: "relative",
  },

  // Background Gradient Styles
  glowBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
});

