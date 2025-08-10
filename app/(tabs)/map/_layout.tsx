import { LinearGradient } from "expo-linear-gradient";
import { Stack } from "expo-router";
import { StyleSheet, View } from "react-native";

import { COLORS } from "../../../utils/constants";
import { FONT_SIZES, FONT_WEIGHTS } from "../../../utils/fonts";

// Constants
const GRADIENT_COLORS = [
  "rgba(74, 144, 226, 0.5)", // Blue at top
  "rgba(74, 144, 226, 0.2)",
  "transparent",
  "rgba(255, 138, 0, 0.2)", // Orange transition
  "rgba(255, 138, 0, 0.4)", // Orange at bottom
] as const;

const GRADIENT_LOCATIONS = [0, 0.2, 0.5, 0.8, 1] as const;

const GRADIENT_CONFIG = {
  start: { x: 0.5, y: 0 },
  end: { x: 0.5, y: 1 },
} as const;

// Screen configurations
const getIndexScreenOptions = () => ({
  title: "Map",
  headerShown: true,
  headerStyle: {
    backgroundColor: COLORS.brand.blue,
  },
  headerTintColor: COLORS.white,
  headerTitleStyle: {
    fontFamily: FONT_WEIGHTS.bold,
    fontSize: FONT_SIZES.lg,
  },
});

const getViewScreenOptions = () => ({
  headerShown: false,
  presentation: 'fullScreenModal' as const,
});

export default function MapLayout() {
  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={GRADIENT_COLORS}
        locations={GRADIENT_LOCATIONS}
        style={styles.glowBackground}
        start={GRADIENT_CONFIG.start}
        end={GRADIENT_CONFIG.end}
      />

      {/* Navigation Stack */}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen 
          name="index"
          options={getIndexScreenOptions()}
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
  glowBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
});
