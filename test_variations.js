// Test different variations of the API call to match Swagger exactly
const axios = require('axios');

async function testVariations() {
  const API_BASE_URL = 'https://mhmahi-001-site1.qtempurl.com';
  const mobile = '01303099926';
  
  console.log('🧪 Testing different API call variations...\n');
  
  // Variation 1: Exact mobile number
  await testVariation('Exact mobile', { mobile: '01303099926' });
  
  // Variation 2: Different mobile formats
  await testVariation('With +88', { mobile: '+8801303099926' });
  await testVariation('With 88', { mobile: '8801303099926' });
  
  // Variation 3: Different field names (in case API expects different field)
  await testVariation('mobileNumber field', { mobileNumber: '01303099926' });
  await testVariation('phone field', { phone: '01303099926' });
  await testVariation('Mobile field (capital)', { Mobile: '01303099926' });
  
  // Variation 4: String vs number
  await testVariation('Number as string', { mobile: "01303099926" });
  
  // Variation 5: With additional fields
  await testVariation('With password', { mobile: '01303099926', password: '123456' });
  await testVariation('With otp', { mobile: '01303099926', otp: '123456' });
}

async function testVariation(name, payload) {
  try {
    console.log(`📱 Testing ${name}:`, JSON.stringify(payload));
    
    const response = await axios.post('https://mhmahi-001-site1.qtempurl.com/api/Auth/token', 
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': '*/*'
        },
        timeout: 10000
      }
    );
    
    if (response.data?.data?.isSuccess) {
      console.log(`✅ ${name} - SUCCESS!`);
      console.log('📊 Response:', JSON.stringify(response.data, null, 2));
      return true;
    } else {
      console.log(`❌ ${name} - Failed:`, response.data?.data?.message || 'Unknown error');
    }
    
  } catch (error) {
    console.log(`❌ ${name} - Error:`, error.response?.data?.data?.message || error.message);
  }
  
  console.log('---');
  return false;
}

testVariations();
