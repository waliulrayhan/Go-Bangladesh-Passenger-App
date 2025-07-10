import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { apiService } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { useCardStore } from '../stores/cardStore';
import { COLORS, SPACING } from '../utils/constants';
import { Card } from './ui/Card';
import { Text } from './ui/Text';

export default function TestHistoryAPI() {
  const { loadHistory, transactions, isLoading, error } = useCardStore();
  const { user } = useAuthStore();
  const [directApiResult, setDirectApiResult] = useState<any>(null);
  const [directApiLoading, setDirectApiLoading] = useState(false);

  const testStoreAPI = async () => {
    try {
      console.log('🧪 [TEST] Testing store API integration...');
      console.log('👤 [TEST] Current user:', user);
      
      await loadHistory(1, true);
      
      console.log('✅ [TEST] Store API call completed');
      Alert.alert('Store Test Result', `Store API call completed. Found ${transactions.length} transactions.`);
    } catch (error: any) {
      console.error('❌ [TEST] Store API test failed:', error);
      Alert.alert('Store Test Failed', error?.message || 'Unknown error');
    }
  };

  const testDirectAPI = async () => {
    setDirectApiLoading(true);
    setDirectApiResult(null);

    try {
      // Use the same ID format as working Postman request
      const userId = user?.id?.toString() || '585ce04804e64057a2dc6a0840c4f53e';
      console.log('🧪 [TEST] Testing direct API with user ID:', userId);
      
      const response = await apiService.getPassengerHistory(userId, 1, 10);
      
      console.log('✅ [TEST] Direct API Response:', response);
      setDirectApiResult(response);
      
      Alert.alert(
        'Direct API Success!', 
        `Found ${response.data.content?.length || 0} transactions.`
      );
    } catch (err: any) {
      console.error('❌ [TEST] Direct API Error:', err);
      Alert.alert('Direct API Error', err.message || 'Failed to fetch history');
    } finally {
      setDirectApiLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Text variant="h6" style={styles.title}>Test History API Integration</Text>
        
        <View style={styles.infoContainer}>
          <Text variant="body" style={styles.info}>
            User ID: {user?.id || 'Not logged in'}
          </Text>
          <Text variant="body" style={styles.info}>
            Passenger ID: {user?.passengerId || 'Not available'}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: COLORS.primary }]}
          onPress={testStoreAPI}
          disabled={isLoading}
        >
          <Text variant="body" style={styles.buttonText}>
            {isLoading ? 'Testing Store...' : 'Test Store API'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: COLORS.secondary }]}
          onPress={testDirectAPI}
          disabled={directApiLoading}
        >
          <Text variant="body" style={styles.buttonText}>
            {directApiLoading ? 'Testing Direct...' : 'Test Direct API'}
          </Text>
        </TouchableOpacity>

        <View style={styles.statusContainer}>
          <Text variant="label" style={styles.statusTitle}>Store Status:</Text>
          <Text variant="body" style={styles.statusText}>Loading: {isLoading ? 'Yes' : 'No'}</Text>
          <Text variant="body" style={styles.statusText}>Error: {error || 'None'}</Text>
          <Text variant="body" style={styles.statusText}>Transactions: {transactions.length}</Text>
        </View>

        {directApiResult && (
          <View style={styles.resultContainer}>
            <Text variant="label" style={styles.resultTitle}>
              Direct API Response:
            </Text>
            <Text variant="bodySmall" style={styles.resultText}>
              Success: {directApiResult.data.isSuccess ? 'Yes' : 'No'}
            </Text>
            <Text variant="bodySmall" style={styles.resultText}>
              Transactions: {directApiResult.data.content?.length || 0}
            </Text>
            <Text variant="bodySmall" style={styles.resultText}>
              Timestamp: {directApiResult.data.timeStamp}
            </Text>
            
            {directApiResult.data.content && directApiResult.data.content.length > 0 && (
              <View style={styles.sampleContainer}>
                <Text variant="label" style={styles.sampleTitle}>
                  Sample Transaction:
                </Text>
                <Text variant="bodySmall" style={styles.sampleText}>
                  Type: {directApiResult.data.content[0].transactionType}
                </Text>
                <Text variant="bodySmall" style={styles.sampleText}>
                  Amount: ৳{directApiResult.data.content[0].amount}
                </Text>
                <Text variant="bodySmall" style={styles.sampleText}>
                  Date: {new Date(directApiResult.data.content[0].createTime).toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>
        )}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.md,
  },
  card: {
    padding: SPACING.md,
  },
  title: {
    marginBottom: SPACING.md,
    color: COLORS.gray[900],
  },
  infoContainer: {
    marginBottom: SPACING.md,
  },
  info: {
    color: COLORS.gray[600],
    marginBottom: SPACING.xs,
  },
  button: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  buttonText: {
    color: COLORS.white,
    fontWeight: '600',
  },
  statusContainer: {
    backgroundColor: COLORS.gray[50],
    padding: SPACING.sm,
    borderRadius: 8,
    marginBottom: SPACING.md,
  },
  statusTitle: {
    marginBottom: SPACING.xs,
    color: COLORS.gray[900],
  },
  statusText: {
    marginBottom: SPACING.xs,
    color: COLORS.gray[700],
  },
  resultContainer: {
    backgroundColor: COLORS.gray[50],
    padding: SPACING.sm,
    borderRadius: 8,
  },
  resultTitle: {
    marginBottom: SPACING.sm,
    color: COLORS.gray[900],
  },
  resultText: {
    marginBottom: SPACING.xs,
    color: COLORS.gray[700],
  },
  sampleContainer: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
  },
  sampleTitle: {
    marginBottom: SPACING.xs,
    color: COLORS.gray[900],
  },
  sampleText: {
    marginBottom: SPACING.xs,
    color: COLORS.gray[600],
  },
});
