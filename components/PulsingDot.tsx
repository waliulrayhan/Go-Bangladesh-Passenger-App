import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';
import { COLORS } from '../utils/constants';

interface PulsingDotProps {
  color?: string;
  size?: number;
}

export const PulsingDot: React.FC<PulsingDotProps> = ({
  color = COLORS.success,
  size = 8,
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.5, {
        duration: 1000,
        easing: Easing.inOut(Easing.quad),
      }),
      -1,
      true
    );

    opacity.value = withRepeat(
      withTiming(0.5, {
        duration: 1000,
        easing: Easing.inOut(Easing.quad),
      }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const staticStyle = useAnimatedStyle(() => ({}));

  return (
    <View style={[styles.container, { width: size * 2, height: size * 2 }]}>
      {/* Pulsing outer ring */}
      <Animated.View
        style={[
          styles.pulse,
          {
            width: size * 2,
            height: size * 2,
            borderRadius: size,
            backgroundColor: color,
            opacity: 0.3,
          },
          animatedStyle,
        ]}
      />
      
      {/* Static inner dot */}
      <Animated.View
        style={[
          styles.dot,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
          },
          staticStyle,
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  pulse: {
    position: 'absolute',
  },
  dot: {
    position: 'absolute',
  },
});

