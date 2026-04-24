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
        
        // Test 1: Get groups to find a group ID
        testGetGroups(token);
      }
    } catch (e) {
      console.log('❌ Failed to parse login JSON');
    }
  });
});

function testGetGroups(token) {
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/groups',
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
        if (res.statusCode === 200 && json.success && json.data.groups.length > 0) {
          console.log('✅ Groups endpoint working');
          const groupId = json.data.groups[0].id;
          console.log(`   Testing with group ID: ${groupId}`);
          testGetGroupDetails(token, groupId);
        } else {
          console.log('❌ Groups endpoint failed or no groups found');
        }
      } catch (e) {
        console.log('❌ Groups endpoint returned invalid JSON');
      }
    });
  });
  
  req.on('error', (error) => {
    console.log('❌ Groups endpoint error:', error.message);
  });
  
  req.end();
}

function testGetGroupDetails(token, groupId) {
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: `/api/groups/${groupId}`,
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
          console.log('✅ Group details endpoint working');
          console.log(`   Group status: ${json.data.status}`);
          console.log(`   Current round: ${json.data.current_round}`);
        } else {
          console.log('❌ Group details endpoint failed');
        }
      } catch (e) {
        console.log('❌ Group details endpoint returned invalid JSON');
      }
    });
  });
  
  req.on('error', (error) => {
    console.log('❌ Group details endpoint error:', error.message);
  });
  
  req.end();
}

loginReq.on('error', (error) => {
  console.error('Login Error:', error.message);
});

loginReq.write(loginData);
loginReq.end();
