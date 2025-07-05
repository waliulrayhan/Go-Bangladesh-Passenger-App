// Test History API Integration
// This is a simple test to verify the history API works correctly

import { useCardStore } from '../stores/cardStore';

async function testHistoryAPI() {
  console.log('🧪 Testing History API...');
  
  const store = useCardStore.getState();
  
  try {
    // Test initial load
    await store.loadHistory(1, true);
    console.log('✅ Initial load successful');
    console.log('Transactions loaded:', store.transactions.length);
    console.log('Trips loaded:', store.trips.length);
    
    // Test pagination
    if (store.historyPagination.hasMore) {
      await store.loadMoreHistory();
      console.log('✅ Pagination load successful');
      console.log('Total transactions after pagination:', store.transactions.length);
    }
    
    // Test refresh
    await store.loadHistory(1, true);
    console.log('✅ Refresh successful');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Export for testing
export { testHistoryAPI };

