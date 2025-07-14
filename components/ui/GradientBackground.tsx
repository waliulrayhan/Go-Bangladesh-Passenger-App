import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../utils/colors';

interface GradientBackgroundProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'subtle';
}

export const GradientBackground: React.FC<GradientBackgroundProps> = ({ 
  children, 
  variant = 'primary' 
}) => {
  const getGradientColors = (): string[] => {
    switch (variant) {
      case 'primary':
        return [
          colors.primary.blue + 'E6', // 90% opacity
          colors.primary.blueLight + 'CC', // 80% opacity
          colors.primary.orange + 'B3', // 70% opacity
          colors.primary.orangeLight + '99', // 60% opacity
        ];
      case 'secondary':
        return [
          colors.primary.blueSubtle,
          colors.primary.orangeSubtle,
          colors.neutral.gray50,
        ];
      case 'subtle':
        return [
          colors.neutral.gray50,
          colors.neutral.white,
          colors.primary.blueSubtle,
        ];
      default:
        return [colors.neutral.white, colors.neutral.gray50];
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={getGradientColors() as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      />
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
