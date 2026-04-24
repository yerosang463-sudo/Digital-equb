const http = require('http');

// First, login to get a token
const loginOptions = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  }
};

const loginData = JSON.stringify({
  email: 'yerosang463@gmail.com',
  password: '@yero27101620'
});

const loginReq = http.request(loginOptions, (loginRes) => {
  let loginData = '';
  loginRes.on('data', (chunk) => {
    loginData += chunk;
  });
  
  loginRes.on('end', () => {
    try {
      const loginJson = JSON.parse(loginData);
      if (loginJson.success && loginJson.token) {
        const token = loginJson.token;
        console.log('✅ Login successful');
        
        // Test 1: Analytics endpoint
        testEndpoint('/api/admin/analytics', token, 'Analytics');
        
        // Test 2: Users endpoint
        testEndpoint('/api/admin/users', token, 'Users');
        
        // Test 3: Groups endpoint
        testEndpoint('/api/admin/groups', token, 'Groups');
        
        // Test 4: Payments endpoint
        testEndpoint('/api/admin/payments', token, 'Payments');
        
        // Test 5: Payouts endpoint
        testEndpoint('/api/admin/payouts', token, 'Payouts');
      }
    } catch (e) {
      console.log('❌ Failed to parse login JSON');
    }
  });
});

function testEndpoint(path, token, name) {
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: path,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    }
  };
  
  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        if (json.success) {
          console.log(`✅ ${name} endpoint working`);
        } else {
          console.log(`❌ ${name} endpoint failed: ${json.message}`);
        }
      } catch (e) {
        console.log(`❌ ${name} endpoint returned invalid JSON`);
      }
    });
  });
  
  req.on('error', (error) => {
    console.log(`❌ ${name} endpoint error: ${error.message}`);
  });
  
  req.end();
}

loginReq.on('error', (error) => {
  console.error('Login Error:', error.message);
});

loginReq.write(loginData);
loginReq.end();
