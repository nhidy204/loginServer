const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testRegister() {
  console.log('🧪 Testing Register with new user...\n');
  
  // Tạo username và email ngẫu nhiên
  const timestamp = Date.now();
  const username = `newuser${timestamp}`;
  const email = `newuser${timestamp}@example.com`;
  
  console.log(`📝 Trying to register:`);
  console.log(`   Username: ${username}`);
  console.log(`   Email: ${email}`);
  
  try {
    const response = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: username,
        email: email,
        password: 'password123'
      })
    });
    
    const data = await response.json();
    console.log(`\n📤 Response:`, data);
    
    if (response.ok) {
      console.log('✅ Register successful!');
    } else {
      console.log('❌ Register failed!');
    }
    
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
}

testRegister(); 