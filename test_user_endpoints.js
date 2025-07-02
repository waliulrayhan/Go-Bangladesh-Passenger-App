// Test different API endpoints to find the correct one for user details
const API_BASE_URL = 'https://mhmahi-001-site1.qtempurl.com';

async function testUserEndpoints(userId) {
  const endpoints = [
    `/api/passenger/getById/${userId}`,
    `/api/user/getById/${userId}`,
    `/api/users/${userId}`,
    `/api/passenger/${userId}`,
    `/api/User/getById/${userId}`,
    `/api/Passenger/getById/${userId}`,
    `/api/auth/user/${userId}`,
    `/api/Auth/user/${userId}`
  ];

  console.log('🧪 Testing user endpoints with ID:', userId);
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n📡 Testing: ${API_BASE_URL}${endpoint}`);
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Add auth header if needed
        }
      });
      
      console.log(`   Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ SUCCESS! Data:`, data);
      } else {
        console.log(`   ❌ Failed: ${response.statusText}`);
      }
    } catch (error) {
      console.log(`   💥 Error:`, error.message);
    }
  }
}

// Test with different user ID formats
async function runTests() {
  console.log('🚀 Starting API endpoint tests...\n');
  
  // Test with different possible user ID values
  const testIds = ['1', '01712345678', 'test@example.com'];
  
  for (const id of testIds) {
    await testUserEndpoints(id);
    console.log('\n' + '='.repeat(50) + '\n');
  }
}

runTests();
