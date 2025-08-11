import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Tabs, useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import { useAuthStore } from "../../stores/authStore";
import { COLORS } from "../../utils/constants";
import { FONT_SIZES, FONT_WEIGHTS } from "../../utils/fonts";

export default function TabsLayout() {
  const { logout, user } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      // The logout function now handles navigation internally
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
      // Fallback navigation if something goes wrong
      try {
        router.replace("/");
      } catch (navError) {
        console.error("Navigation fallback also failed:", navError);
      }
    }
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
            headerShown: false,
            tabBarLabel: "Home",
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? "home" : "home-outline"} size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: "History",
            tabBarLabel: "History",
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? "time" : "time-outline"} size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="map"
          options={{
            headerShown: false,
            tabBarLabel: "Map",
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? "map" : "map-outline"} size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarLabel: "Profile",
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? "person" : "person-outline"} size={size} color={color} />
            ),
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
