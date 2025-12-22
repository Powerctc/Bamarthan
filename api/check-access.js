// api/check-access.js - UPDATED (Reads from approved_users.json)
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Get device ID
  let deviceId;
  if (req.method === 'GET') {
    deviceId = req.query.deviceId;
  } else if (req.method === 'POST') {
    deviceId = req.body.deviceId;
  }
  
  console.log('🔍 Checking access for:', deviceId);
  
  if (!deviceId) {
    return res.status(400).json({ 
      status: 'error', 
      message: 'Device ID required' 
    });
  }
  
  try {
    // ✅ ဒီနေရာမှာ approved_users.json ဖိုင်ကို fetch လုပ်မယ်
    const approvedUsers = await getApprovedUsers();
    
    console.log('📋 Approved users count:', approvedUsers.length);
    console.log('📋 Looking for device:', deviceId);
    
    const user = approvedUsers.find(u => u.deviceId === deviceId);
    
    if (!user) {
      console.log('❌ Device not found in approved list');
      return res.json({
        status: 'pending',
        deviceId: deviceId,
        message: 'Device not approved. Please contact admin with your Device ID.',
        timestamp: new Date().toISOString()
      });
    }
    
    console.log('✅ Device found:', user.deviceId, 'Expires:', user.expires);
    
    // Check expiry
    const today = new Date();
    const expiry = new Date(user.expires);
    
    if (expiry < today) {
      console.log('❌ Subscription expired');
      return res.json({
        status: 'expired',
        deviceId: deviceId,
        expires: user.expires,
        message: `Your subscription expired on ${user.expires}`,
        timestamp: new Date().toISOString()
      });
    }
    
    // ✅ APPROVED
    console.log('🎉 Device approved!');
    return res.json({
      status: 'approved',
      deviceId: deviceId,
      expires: user.expires,
      registeredAt: user.registeredAt || new Date().toISOString().split('T')[0],
      name: user.name || 'User',
      package: user.package || 'Basic',
      message: 'Access granted',
      timestamp: new Date().toISOString(),
      daysRemaining: Math.ceil((expiry - today) / (1000 * 60 * 60 * 24))
    });
    
  } catch (error) {
    console.error('❌ Error checking access:', error);
    
    // Fallback to hardcoded list if file not found
    console.log('⚠️ Using fallback approved list');
    return fallbackCheck(deviceId);
  }
}

// Function to fetch approved users from file
async function getApprovedUsers() {
  try {
    // GitHub raw URL (မင်း repo URL နဲ့ပြောင်း)
    const GITHUB_RAW_URL = 'https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/approved_users.json';
    
    console.log('📥 Fetching approved users from:', GITHUB_RAW_URL);
    
    const response = await fetch(GITHUB_RAW_URL + '?_t=' + Date.now(), {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ Successfully loaded approved users:', data.users?.length || 0, 'users');
    
    return data.users || [];
    
  } catch (error) {
    console.error('❌ Failed to load approved_users.json:', error.message);
    
    // Try local file (for Vercel deployment)
    try {
      // In Vercel, you can use relative path
      const fs = require('fs');
      const path = require('path');
      
      const filePath = path.join(process.cwd(), 'approved_users.json');
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(fileContent);
      
      console.log('✅ Loaded approved users from local file');
      return data.users || [];
      
    } catch (fsError) {
      console.error('❌ Local file also failed:', fsError.message);
      return []; // Return empty array
    }
  }
}

// Fallback function if file loading fails
function fallbackCheck(deviceId) {
  // Hardcoded fallback list (for testing)
  const fallbackUsers = [
    {
      deviceId: "S4TV_KBHCZL_D2B0",  // ✅ မင်း Device ID
      expires: "2025-12-31",
      registeredAt: "2024-01-20",
      name: "Admin",
      package: "Premium"
    }
  ];
  
  const user = fallbackUsers.find(u => u.deviceId === deviceId);
  
  if (!user) {
    return {
      status: 'pending',
      deviceId: deviceId,
      message: 'Device not approved (fallback check).'
    };
  }
  
  const today = new Date();
  const expiry = new Date(user.expires);
  
  if (expiry < today) {
    return {
      status: 'expired',
      deviceId: deviceId,
      expires: user.expires,
      message: `Expired on ${user.expires} (fallback)`
    };
  }
  
  return {
    status: 'approved',
    deviceId: deviceId,
    expires: user.expires,
    message: 'Access granted (fallback)'
  };
    }
