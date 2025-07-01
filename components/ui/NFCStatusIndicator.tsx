import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { COLORS } from '../../utils/constants';
import { Text } from './Text';

interface NFCStatusIndicatorProps {
  isNFCAvailable: boolean;
  isScanning: boolean;
  isProcessing: boolean;
}

export function NFCStatusIndicator({ 
  isNFCAvailable, 
  isScanning, 
  isProcessing 
}: NFCStatusIndicatorProps) {
  const getStatusColor = () => {
    if (isProcessing) return COLORS.warning;
    if (isScanning && isNFCAvailable) return COLORS.success;
    if (isNFCAvailable) return COLORS.primary;
    return COLORS.error;
  };

  const getStatusIcon = () => {
    if (isProcessing) return 'sync';
    if (isScanning && isNFCAvailable) return 'radio';
    if (isNFCAvailable) return 'checkmark-circle';
    return 'close-circle';
  };

  const getStatusText = () => {
    if (isProcessing) return 'Processing...';
    if (isScanning && isNFCAvailable) return 'NFC Active';
    if (isNFCAvailable) return 'NFC Ready';
    return 'NFC Unavailable';
  };

  return (
    <View style={[styles.container, { backgroundColor: getStatusColor() + '15' }]}>
      <View style={[styles.indicator, { backgroundColor: getStatusColor() }]}>
        <Ionicons 
          name={getStatusIcon()} 
          size={16} 
          color={COLORS.white} 
        />
      </View>
      <Text style={[styles.text, { color: getStatusColor() }]}>
        {getStatusText()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  indicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
