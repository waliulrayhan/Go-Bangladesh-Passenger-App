import { COLORS } from '@/utils/constants';
import React from 'react';
import { StyleSheet, View } from 'react-native';

interface SimpleLogoProps {
  size?: number;
}

export const SimpleLogo: React.FC<SimpleLogoProps> = ({ size = 100 }) => {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Blue upper shape */}
      <View style={[styles.upperShape, { 
        width: size * 0.8, 
        height: size * 0.35,
        borderRadius: size * 0.15,
        backgroundColor: COLORS.brand.blue 
      }]}>
        {/* White dots */}
        <View style={[styles.dot, { 
          width: size * 0.08, 
          height: size * 0.08,
          left: size * 0.1,
          top: size * 0.1,
          borderRadius: size * 0.04 
        }]} />
        <View style={[styles.dot, { 
          width: size * 0.06, 
          height: size * 0.06,
          left: size * 0.3,
          top: size * 0.05,
          borderRadius: size * 0.03 
        }]} />
        <View style={[styles.dot, { 
          width: size * 0.07, 
          height: size * 0.07,
          right: size * 0.15,
          top: size * 0.12,
          borderRadius: size * 0.035 
        }]} />
      </View>
      
      {/* Orange lower shape */}
      <View style={[styles.lowerShape, { 
        width: size * 0.8, 
        height: size * 0.35,
        borderRadius: size * 0.15,
        backgroundColor: COLORS.brand.orange 
      }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  upperShape: {
    position: 'relative',
    justifyContent: 'center',
  },
  lowerShape: {
    position: 'relative',
  },
  dot: {
    position: 'absolute',
    backgroundColor: 'white',
  },
});
