// Test the successful authentication flow
const axios = require('axios');

async function testSuccessfulAuth() {
  const API_BASE_URL = 'https://mhmahi-001-site1.qtempurl.com';
  const mobile = '01303099926';
  
  try {
    console.log('🧪 Testing authentication flow...\n');
    
    // Step 1: Test auth token endpoint
    console.log('📱 Testing /api/Auth/token with mobile:', mobile);
    const authResponse = await axios.post(`${API_BASE_URL}/api/Auth/token`, 
      { mobile },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      }
    );
    
    console.log('✅ Auth Response Status:', authResponse.status);
    console.log('📊 Auth Response Data:', JSON.stringify(authResponse.data, null, 2));
    
    // Check if successful
    if (authResponse.data?.data?.isSuccess) {
      console.log('\n🎉 Authentication successful!');
      const token = authResponse.data.data.content.token;
      const refreshToken = authResponse.data.data.content.refreshToken;
      
      console.log('🔑 Token received:', token ? 'YES' : 'NO');
      console.log('🔄 Refresh token received:', refreshToken ? 'YES' : 'NO');
      
      // Step 2: Try to decode the JWT to get user ID
      if (token) {
        try {
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          }).join(''));
          
          const decoded = JSON.parse(jsonPayload);
          console.log('\n🔍 JWT Payload:', JSON.stringify(decoded, null, 2));
          
          // Extract user ID (might be in different fields)
          const userId = decoded.id || decoded.userId || decoded.ID || decoded.sub;
          console.log('👤 User ID extracted:', userId);
          
          // Step 3: Test user details endpoint if we have a user ID
          if (userId) {
            console.log('\n👤 Testing /api/passenger/getById/' + userId);
            try {
              const userResponse = await axios.get(`${API_BASE_URL}/api/passenger/getById/${userId}`, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                },
                timeout: 10000
              });
              
              console.log('✅ User Details Status:', userResponse.status);
              console.log('📊 User Details Data:', JSON.stringify(userResponse.data, null, 2));
            } catch (userError) {
              console.log('❌ User Details Error:');
              if (userError.response) {
                console.log('Status:', userError.response.status);
                console.log('Data:', JSON.stringify(userError.response.data, null, 2));
              } else {
                console.log('Network Error:', userError.message);
              }
            }
          }
          
        } catch (decodeError) {
          console.log('❌ Failed to decode JWT:', decodeError.message);
        }
      }
      
    } else {
      console.log('❌ Authentication failed:', authResponse.data?.data?.message);
    }
    
  } catch (error) {
    console.log('❌ Error during authentication test:');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('Network Error:', error.message);
    }
  }
}

testSuccessfulAuth();
