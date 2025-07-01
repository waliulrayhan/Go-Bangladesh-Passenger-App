import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { SlideInDown } from 'react-native-reanimated';
import { Text } from './Text';

interface WelcomePopupProps {
  visible: boolean;
  userName: string;
  onClose: () => void;
}

// Lemon character component
const LemonCharacter = () => (
  <View style={styles.lemonContainer}>
    {/* Lemon body */}
    <View style={styles.lemonBody}>
      {/* Leaf */}
      <View style={styles.leaf} />
      
      {/* Eyes */}
      <View style={styles.eyesContainer}>
        <View style={styles.eye} />
        <View style={styles.eye} />
      </View>
      
      {/* Mouth */}
      <View style={styles.mouth} />
    </View>
    
    {/* Arms */}
    <View style={styles.leftArm} />
    <View style={styles.rightArm} />
    
    {/* Legs */}
    <View style={styles.leftLeg} />
    <View style={styles.rightLeg} />
  </View>
);

// Dots indicator component
const DotsIndicator = () => (
  <View style={styles.dotsContainer}>
    <View style={[styles.dot, styles.activeDot]} />
    <View style={styles.dot} />
    <View style={styles.dot} />
  </View>
);

export const WelcomePopup: React.FC<WelcomePopupProps> = ({
  visible,
  userName,
  onClose
}) => {
  // Auto-dismiss after 10 seconds for better UX
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        onClose();
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <LinearGradient
        colors={['#4A90E2', '#2E5BBA', '#1E3A8A']}
        style={styles.overlay}
      >
        <TouchableOpacity 
          style={styles.skipButton}
          onPress={onClose}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>

        <View style={styles.centerContainer}>
          <Animated.View 
            entering={SlideInDown.duration(600).springify()}
            style={styles.content}
          >
            {/* Logo */}
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>Go Bangladesh</Text>
            </View>

            {/* Main Card */}
            <View style={styles.card}>
              <LemonCharacter />
              
              <Text style={styles.title}>Welcome Back!</Text>
              <Text style={styles.subtitle}>Hello {userName}, ready for your journey?</Text>
              
              <DotsIndicator />
            </View>

            {/* Get Started Button */}
            <TouchableOpacity style={styles.button} onPress={onClose}>
              <Text style={styles.buttonText}>Get Started</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </LinearGradient>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    paddingHorizontal: 20,
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  skipText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    opacity: 0.9,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 2,
    opacity: 0.95,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 40,
    width: '90%',
    maxWidth: 340,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 30,
    marginBottom: 40,
  },
  lemonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 25,
    position: 'relative',
    width: 130,
    height: 130,
  },
  lemonBody: {
    width: 85,
    height: 85,
    backgroundColor: '#FCD34D',
    borderRadius: 42.5,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    zIndex: 2,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  leaf: {
    position: 'absolute',
    top: -10,
    right: 18,
    width: 22,
    height: 14,
    backgroundColor: '#22C55E',
    borderRadius: 12,
    transform: [{ rotate: '45deg' }],
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  eyesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 32,
    marginBottom: 10,
  },
  eye: {
    width: 9,
    height: 9,
    backgroundColor: '#000',
    borderRadius: 4.5,
  },
  mouth: {
    width: 18,
    height: 9,
    borderRadius: 9,
    backgroundColor: '#000',
    marginTop: 2,
  },
  leftArm: {
    position: 'absolute',
    left: 8,
    top: 32,
    width: 28,
    height: 7,
    backgroundColor: '#FCD34D',
    borderRadius: 3.5,
    transform: [{ rotate: '-25deg' }],
    zIndex: 1,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  rightArm: {
    position: 'absolute',
    right: 8,
    top: 32,
    width: 28,
    height: 7,
    backgroundColor: '#FCD34D',
    borderRadius: 3.5,
    transform: [{ rotate: '25deg' }],
    zIndex: 1,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  leftLeg: {
    position: 'absolute',
    left: 28,
    bottom: 8,
    width: 7,
    height: 22,
    backgroundColor: '#FCD34D',
    borderRadius: 3.5,
    zIndex: 1,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  rightLeg: {
    position: 'absolute',
    right: 28,
    bottom: 8,
    width: 7,
    height: 22,
    backgroundColor: '#FCD34D',
    borderRadius: 3.5,
    zIndex: 1,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 5,
  },
  activeDot: {
    backgroundColor: '#EF4444',
    transform: [{ scale: 1.2 }],
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#7C3AED',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 48,
    paddingVertical: 18,
    borderRadius: 30,
    width: '90%',
    maxWidth: 340,
    alignItems: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
    transform: [{ scale: 1 }],
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
