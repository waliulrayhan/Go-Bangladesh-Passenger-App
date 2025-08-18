import { LinearGradient } from "expo-linear-gradient";
import { Stack } from "expo-router";
import { StyleSheet, View } from "react-native";


// Screen configurations
const getViewScreenOptions = () => ({
  headerShown: false,
  presentation: 'fullScreenModal' as const,
});

export default function MapLayout() {
  return (
    <View style={styles.container}>
      {/* Background Gradient */}
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

      {/* Navigation Stack */}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen 
          name="index"
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="view"
          options={getViewScreenOptions()}
        />
      </Stack>
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
