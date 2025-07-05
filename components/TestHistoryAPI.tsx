import { Alert, TouchableOpacity, View } from 'react-native';
import { Text } from '../components/ui/Text';
import { useAuthStore } from '../stores/authStore';
import { useCardStore } from '../stores/cardStore';

export default function TestHistoryAPI() {
  const { loadHistory, transactions, isLoading, error } = useCardStore();
  const { user } = useAuthStore();

  const testAPI = async () => {
    try {
      console.log('🧪 [TEST] Starting manual API test...');
      console.log('👤 [TEST] Current user:', user);
      
      await loadHistory(1, true);
      
      console.log('✅ [TEST] API call completed');
      Alert.alert('Test Result', `API call completed. Check logs for details.`);
    } catch (error: any) {
      console.error('❌ [TEST] API test failed:', error);
      Alert.alert('Test Failed', error?.message || 'Unknown error');
    }
  };

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
      <TouchableOpacity 
        onPress={testAPI}
        style={{ 
          backgroundColor: '#007AFF', 
          padding: 15, 
          borderRadius: 8, 
          marginBottom: 20 
        }}
      >
        <Text style={{ color: 'white', textAlign: 'center' }}>
          Test History API
        </Text>
      </TouchableOpacity>
      
      <Text>Loading: {isLoading ? 'Yes' : 'No'}</Text>
      <Text>Error: {error || 'None'}</Text>
      <Text>Transactions: {transactions.length}</Text>
      <Text>User ID: {user?.id || 'Not logged in'}</Text>
    </View>
  );
}
