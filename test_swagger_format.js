// Test the exact same format as Swagger UI
const axios = require('axios');

async function testSwaggerFormat() {
  const API_BASE_URL = 'https://mhmahi-001-site1.qtempurl.com';
  
  // Exact same payload as shown in Swagger UI
  const payload = {
    "password": "123456",
    "mobileNumber": "01303099926"
  };
  
  try {
    console.log('🧪 Testing with exact Swagger format...');
    console.log('📱 API URL:', `${API_BASE_URL}/api/Auth/token`);
    console.log('📦 Payload:', JSON.stringify(payload, null, 2));
    
    const response = await axios.post(`${API_BASE_URL}/api/Auth/token`, 
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': '*/*'
        },
        timeout: 10000
      }
    );
    
    console.log('✅ Response Status:', response.status);
    console.log('📊 Response Data:', JSON.stringify(response.data, null, 2));
    
    if (response.data?.data?.isSuccess) {
      console.log('\n🎉 SUCCESS! Authentication worked!');
      console.log('🔑 Token:', response.data.data.content.token ? 'Received' : 'Not received');
      console.log('🔄 Refresh Token:', response.data.data.content.refreshToken ? 'Received' : 'Not received');
    } else {
      console.log('\n❌ FAILED:', response.data?.data?.message || 'Unknown error');
    }
    
  } catch (error) {
    console.log('❌ Error:');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('Network Error:', error.message);
    }
  }
}

testSwaggerFormat();
