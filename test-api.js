const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const BASE_URL = 'http://localhost:3000/api/auth';

async function testAPI() {
  console.log('🧪 Testing Authentication API...\n');

  // Test 1: Register
  console.log('1️⃣ Testing Register...');
  try {
    const registerResponse = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'testuser2',
        email: 'test2@example.com',
        password: 'password123'
      })
    });
    const registerData = await registerResponse.json();
    console.log('✅ Register:', registerData.message);
  } catch (error) {
    console.log('❌ Register Error:', error.message);
  }

  // Test 2: Login
  console.log('\n2️⃣ Testing Login...');
  try {
    const loginResponse = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test2@example.com',
        password: 'password123'
      })
    });
    const loginData = await loginResponse.json();
    console.log('✅ Login:', loginData.message);
    
    if (loginData.data && loginData.data.accessToken) {
      console.log('🔑 Access Token:', loginData.data.accessToken.substring(0, 20) + '...');
      
      // Test 3: Protected Route
      console.log('\n3️⃣ Testing Protected Route...');
      try {
        const protectedResponse = await fetch(`${BASE_URL}/protected`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${loginData.data.accessToken}`
          }
        });
        const protectedData = await protectedResponse.json();
        console.log('✅ Protected Route:', protectedData.message);
      } catch (error) {
        console.log('❌ Protected Route Error:', error.message);
      }
    }
  } catch (error) {
    console.log('❌ Login Error:', error.message);
  }

  // Test 4: Forgot Password
  console.log('\n4️⃣ Testing Forgot Password...');
  try {
    const forgotResponse = await fetch(`${BASE_URL}/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test2@example.com'
      })
    });
    const forgotData = await forgotResponse.json();
    console.log('✅ Forgot Password:', forgotData.message);
    
    // Test 5: Reset Password (if token is provided)
    if (forgotData.token) {
      console.log('\n5️⃣ Testing Reset Password...');
      try {
        const resetResponse = await fetch(`${BASE_URL}/reset-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: forgotData.token,
            newPassword: 'newpassword123'
          })
        });
        const resetData = await resetResponse.json();
        console.log('✅ Reset Password:', resetData.message);
      } catch (error) {
        console.log('❌ Reset Password Error:', error.message);
      }
    }
  } catch (error) {
    console.log('❌ Forgot Password Error:', error.message);
  }

  console.log('\n🎉 API Testing Complete!');
}

// Run test
testAPI().catch(console.error); 