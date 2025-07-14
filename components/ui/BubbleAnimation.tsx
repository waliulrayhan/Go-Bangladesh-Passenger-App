import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withTiming
} from 'react-native-reanimated';
import { colors } from '../../utils/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Bubble {
  id: number;
  size: number;
  startX: number;
  startY: number;
  color: string;
  opacity: number;
  duration: number;
  delay: number;
}

const BUBBLE_COLORS = [
  colors.primary.blueSubtle + '80', // 50% opacity
  colors.primary.orangeSubtle + '70', // 44% opacity
  colors.primary.blueLight + '40', // 25% opacity
  colors.primary.orangeLight + '30', // 19% opacity
  colors.neutral.white + '60', // 38% opacity
  colors.primary.blue + '20', // 13% opacity
  colors.primary.orange + '15', // 8% opacity
  '#FFFFFF40', // Pure white with 25% opacity
  '#E8F2FF60', // Light blue with 38% opacity
];

const generateBubbles = (count: number): Bubble[] => {
  return Array.from({ length: count }, (_, index) => ({
    id: index,
    size: Math.random() * 120 + 30, // 30-150px
    startX: Math.random() * SCREEN_WIDTH,
    startY: SCREEN_HEIGHT + 100, // Start below screen
    color: BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)],
    opacity: Math.random() * 0.4 + 0.2, // 0.2-0.6
    duration: Math.random() * 20000 + 15000, // 15-35 seconds
    delay: Math.random() * 8000, // 0-8 seconds
  }));
};

interface BubbleComponentProps {
  bubble: Bubble;
}

const BubbleComponent: React.FC<BubbleComponentProps> = ({ bubble }) => {
  const translateY = useSharedValue(bubble.startY);
  const translateX = useSharedValue(bubble.startX);
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Start animation with delay
    const startAnimation = () => {
      // Fade in
      opacity.value = withDelay(
        bubble.delay,
        withTiming(bubble.opacity, { duration: 1000 })
      );
      
      // Scale in
      scale.value = withDelay(
        bubble.delay,
        withTiming(1, { duration: 1000, easing: Easing.out(Easing.back(1.2)) })
      );

      // Move up
      translateY.value = withDelay(
        bubble.delay,
        withRepeat(
          withTiming(-bubble.size, {
            duration: bubble.duration,
            easing: Easing.inOut(Easing.ease),
          }),
          -1,
          false
        )
      );

      // Gentle horizontal sway
      translateX.value = withDelay(
        bubble.delay,
        withRepeat(
          withTiming(bubble.startX + (Math.random() - 0.5) * 100, {
            duration: bubble.duration / 2,
            easing: Easing.inOut(Easing.sin),
          }),
          -1,
          true
        )
      );
    };

    startAnimation();
  }, [bubble]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View
      style={[
        styles.bubble,
        {
          width: bubble.size,
          height: bubble.size,
          backgroundColor: bubble.color,
          borderRadius: bubble.size / 2,
        },
        animatedStyle,
      ]}
    >
      {/* Inner highlight for glass effect */}
      <View 
        style={[
          styles.bubbleInner,
          {
            width: bubble.size * 0.3,
            height: bubble.size * 0.3,
            borderRadius: (bubble.size * 0.3) / 2,
          }
        ]}
      />
    </Animated.View>
  );
};

interface BubbleAnimationProps {
  bubbleCount?: number;
}

export const BubbleAnimation: React.FC<BubbleAnimationProps> = ({ 
  bubbleCount = 15 
}) => {
  const bubbles = generateBubbles(bubbleCount);

  return (
    <View style={styles.container} pointerEvents="none">
      {bubbles.map((bubble) => (
        <BubbleComponent key={bubble.id} bubble={bubble} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  bubble: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: colors.primary.blue + '20',
    shadowColor: colors.primary.blue,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  bubbleInner: {
    position: 'absolute',
    top: '15%',
    left: '20%',
    backgroundColor: colors.neutral.white + '40',
    shadowColor: colors.neutral.white,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.8,
    shadowRadius: 2,
  },
});
