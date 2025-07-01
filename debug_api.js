// Simple Node.js script to test the API directly
const axios = require('axios');

async function testAPI(mobile) {
  const API_BASE_URL = 'https://mhmahi-001-site1.qtempurl.com';
  
  try {
    console.log(`\nTesting mobile: ${mobile}`);
    console.log('Testing API endpoint:', `${API_BASE_URL}/api/Auth/token`);
    console.log('Payload:', { mobile });
    
    const response = await axios.post(`${API_BASE_URL}/api/Auth/token`, 
      { mobile },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );
    
    console.log('Response:');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));
    
    if (response.data?.data?.isSuccess) {
      console.log('✅ SUCCESS - User found!');
      return true;
    } else {
      console.log('❌ FAILED -', response.data?.data?.message || 'Unknown error');
      return false;
    }
    
  } catch (error) {
    console.log('❌ ERROR:');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('Network Error:', error.message);
    }
    return false;
  }
}

async function testMultipleMobiles() {
  const testNumbers = [
    '01303099926', // Original number
    '01712345678', // Common test pattern
    '01987654321', // Another pattern
    '01500000000', // Round number
    '01711111111', // Pattern
    '01999999999', // High number
    '01234567890'  // Sequential
  ];
  
  console.log('Testing multiple mobile numbers...\n');
  
  for (const mobile of testNumbers) {
    const success = await testAPI(mobile);
    if (success) {
      console.log(`\n🎉 Found working mobile number: ${mobile}`);
      break;
    }
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

testMultipleMobiles();
