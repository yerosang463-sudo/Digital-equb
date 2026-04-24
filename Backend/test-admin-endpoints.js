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
        
        // Test 1: Admin payments endpoint
        testEndpoint('/api/admin/payments', token, 'Admin Payments');
        
        // Test 2: Admin audit logs endpoint
        testEndpoint('/api/admin/audit-logs', token, 'Admin Audit Logs');
        
        // Test 3: Admin payouts endpoint (to verify it still works)
        testEndpoint('/api/admin/payouts', token, 'Admin Payouts');
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
        if (res.statusCode === 200 && json.success) {
          console.log(`✅ ${name} endpoint working - Status: ${res.statusCode}`);
          console.log(`   Data keys: ${Object.keys(json.data || json).join(', ')}`);
        } else {
          console.log(`❌ ${name} endpoint failed - Status: ${res.statusCode}`);
          console.log(`   Message: ${json.message || 'No message'}`);
          console.log(`   Response: ${data.substring(0, 200)}`);
        }
      } catch (e) {
        console.log(`❌ ${name} endpoint returned invalid JSON - Status: ${res.statusCode}`);
        console.log(`   Response: ${data.substring(0, 200)}`);
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
