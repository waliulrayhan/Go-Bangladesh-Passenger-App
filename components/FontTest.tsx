import { useFonts } from 'expo-font';
import React from 'react';
import { Text as RNText, StyleSheet, View } from 'react-native';
import { plusJakartaSansFonts } from '../utils/fonts';

export const FontTest: React.FC = () => {
  const [loaded, error] = useFonts(plusJakartaSansFonts);

  if (!loaded) {
    return (
      <View style={styles.container}>
        <RNText>Loading fonts...</RNText>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <RNText>Error loading fonts: {error.message}</RNText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <RNText style={styles.default}>Default Font</RNText>
      <RNText style={styles.regular}>Plus Jakarta Sans Regular</RNText>
      <RNText style={styles.medium}>Plus Jakarta Sans Medium</RNText>
      <RNText style={styles.semiBold}>Plus Jakarta Sans Semi Bold</RNText>
      <RNText style={styles.bold}>Plus Jakarta Sans Bold</RNText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: 'white',
  },
  default: {
    fontSize: 16,
    marginBottom: 10,
  },
  regular: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 16,
    marginBottom: 10,
  },
  medium: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 16,
    marginBottom: 10,
  },
  semiBold: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 16,
    marginBottom: 10,
  },
  bold: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 16,
    marginBottom: 10,
  },
});
