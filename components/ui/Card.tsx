import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { BORDER_RADIUS, COLORS, SPACING } from '../../utils/constants';

interface CardProps {
  children: React.ReactNode;
  style?: any;
  variant?: 'default' | 'elevated' | 'outlined';
  animated?: boolean;
  delay?: number;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  style, 
  variant = 'default',
  animated = true,
  delay = 0 
}) => {
  const cardStyles = [styles.card, styles[variant], style];

  if (animated) {
    return (
      <Animated.View 
        style={cardStyles}
        entering={FadeInUp.delay(delay).springify()}
      >
        {children}
      </Animated.View>
    );
  }

  return (
    <View style={cardStyles}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  default: {
    // Clean flat design for mobile
  },
  elevated: {
    borderWidth: 1,
    borderColor: COLORS.gray[100],
  },
  outlined: {
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
});

