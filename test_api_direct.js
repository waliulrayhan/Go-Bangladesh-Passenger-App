// Direct API test to check the history endpoint
async function testHistoryAPI() {
  const passengerId = '585ce04804e64057a2dc6a0840c4f53e';
  const url = `https://mhmahi-001-site1.qtempurl.com/api/history/passenger?id=${passengerId}&pageNo=1&pageSize=20`;
  
  console.log('🧪 Testing direct API call...');
  console.log('🔗 URL:', url);
  
  try {
    const response = await fetch(url);
    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', response.headers);
    
    if (!response.ok) {
      console.error('❌ API request failed:', response.status, response.statusText);
      return;
    }
    
    const data = await response.json();
    console.log('📄 Full response:', JSON.stringify(data, null, 2));
    
    if (data.data && data.data.isSuccess) {
      console.log('✅ API returned success');
      console.log('📊 Content length:', data.data.content.length);
      console.log('🔍 First item:', data.data.content[0]);
    } else {
      console.error('❌ API returned error:', data.data?.message);
    }
  } catch (error) {
    console.error('💥 Error:', error);
  }
}

// Call the test function
testHistoryAPI();
