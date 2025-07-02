// Test with authentication token
const API_BASE_URL = 'https://mhmahi-001-site1.qtempurl.com';

async function testWithAuth() {
  console.log('🔐 Testing authentication first...');
  
  // First get a token
  try {
    const authResponse = await fetch(`${API_BASE_URL}/api/Auth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'waliulrayhan@gmail.com',
        password: '123456'
      })
    });
    
    console.log('Auth response status:', authResponse.status);
    
    if (authResponse.ok) {
      const authData = await authResponse.json();
      console.log('Auth response:', authData);
      
      if (authData?.data?.isSuccess && authData?.data?.content?.token) {
        const token = authData.data.content.token;
        console.log('✅ Got token:', token ? 'Yes' : 'No');
        
        // Decode the JWT to see what's inside
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = parts[1];
          const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
          const decodedPayload = Buffer.from(paddedPayload, 'base64').toString('utf-8');
          const parsedPayload = JSON.parse(decodedPayload);
          
          console.log('🎫 JWT Payload:', parsedPayload);
          
          // Try to find user ID
          const possibleIds = [
            parsedPayload.UserId,
            parsedPayload.userId,
            parsedPayload.id,
            parsedPayload.sub
          ].filter(id => id);
          
          console.log('🔍 Possible user IDs found:', possibleIds);
          
          // Now test user endpoints with auth
          for (const userId of possibleIds) {
            await testUserEndpointsWithAuth(userId, token);
          }
        }
      }
    } else {
      console.log('❌ Auth failed:', authResponse.statusText);
    }
  } catch (error) {
    console.error('💥 Auth error:', error.message);
  }
}

async function testUserEndpointsWithAuth(userId, token) {
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

  console.log(`\n🧪 Testing user endpoints with auth for ID: ${userId}`);
  
  for (const endpoint of endpoints) {
    try {
      console.log(`📡 Testing: ${API_BASE_URL}${endpoint}`);
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log(`   Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ SUCCESS! Data:`, JSON.stringify(data, null, 2));
        return; // Found working endpoint
      } else {
        const errorText = await response.text();
        console.log(`   ❌ Failed: ${response.statusText} - ${errorText}`);
      }
    } catch (error) {
      console.log(`   💥 Error:`, error.message);
    }
  }
}

testWithAuth();
