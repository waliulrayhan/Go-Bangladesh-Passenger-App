// Test script to check ongoing trip API
const API_BASE_URL = 'https://mhmahi-001-site1.qtempurl.com';

async function testOngoingTripAPI() {
  console.log('🧪 Testing ongoing trip API...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/passenger/getOnGoingTrip`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    
    console.log('📥 Response status:', response.status);
    
    if (!response.ok) {
      console.error('❌ API request failed:', response.status, response.statusText);
      return;
    }
    
    const data = await response.json();
    console.log('📊 API Response:', JSON.stringify(data, null, 2));
    
    if (data.data?.isSuccess) {
      if (data.data.content) {
        console.log('✅ Ongoing trip found!');
        console.log('🚌 Trip details:', {
          id: data.data.content.id,
          isRunning: data.data.content.isRunning,
          startTime: data.data.content.tripStartTime,
          busNumber: data.data.content.session?.bus?.busNumber,
          busName: data.data.content.session?.bus?.busName,
          route: `${data.data.content.session?.bus?.tripStartPlace} → ${data.data.content.session?.bus?.tripEndPlace}`,
        });
      } else {
        console.log('ℹ️ No ongoing trip found');
      }
    } else {
      console.log('❌ API returned error:', data.data?.message);
    }
    
  } catch (error) {
    console.error('💥 Error testing API:', error.message);
  }
}

// Run the test
testOngoingTripAPI();
