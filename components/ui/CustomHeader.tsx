import React, { useMemo } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { COLORS } from "../../utils/constants";
import { logger } from "../../utils/logger";
import { GoBangladeshLogo } from "../GoBangladeshLogo";
import { Text } from "./Text";
interface CustomHeaderProps {
  title?: string;
  subtitle?: string;
}
export const CustomHeader: React.FC<CustomHeaderProps> = React.memo(({
  title = "Go Bangladesh",
  subtitle = "One step toward a better future",
}) => {
  // Input validation and sanitization
  const sanitizedTitle = useMemo(() => {
    try {
      return typeof title === 'string' ? title.trim().slice(0, 50) : "Go Bangladesh";
    } catch (error) {
      logger.warn('Invalid title provided to CustomHeader', 'CustomHeader', String(error));
      return "Go Bangladesh";
    }
  }, [title]);
  const sanitizedSubtitle = useMemo(() => {
    try {
      return typeof subtitle === 'string' ? subtitle.trim().slice(0, 100) : "One step toward a better future";
    } catch (error) {
      logger.warn('Invalid subtitle provided to CustomHeader', 'CustomHeader', String(error));
      return "One step toward a better future";
    }
  }, [subtitle]);
  return (
    <View style={styles.headerContainer}>
      <View style={styles.leftSection}>
        <Animated.View style={styles.logoContainer}>
          <View style={styles.bubbleBackground}>
            <GoBangladeshLogo
              size={42}
              style={styles.logo}
              color1={COLORS.brand.orange}
              color2={COLORS.brand.blue}
            />
          </View>
        </Animated.View>
        <View style={styles.textContainer}>
          <Text style={styles.titleText}>{sanitizedTitle}</Text>
          <Text style={styles.subtitleText}>{sanitizedSubtitle}</Text>
        </View>
      </View>
    </View>
  );
});
const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: COLORS.brand.blue,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    elevation: 4,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  logoContainer: {
    marginRight: 12,
  },
  bubbleBackground: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#ecececec",
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    // Additional logo styling if needed
  },
  textContainer: {
    flex: 1,
  },
  titleText: {
    color: COLORS.white,
    fontSize: 18,
  },
  subtitleText: {
    color: COLORS.white,
    fontSize: 12,
    opacity: 0.9,
    marginTop: 2,
    lineHeight: 16,
  },
});
