// /api/check-access.js
export default async function handler(req, res) {
  // CORS headers ထည့်ပါ
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // GET နဲ့ POST နှစ်မျိုးလုံးကို support လုပ်မယ်
  let deviceId;
  
  if (req.method === 'GET') {
    deviceId = req.query.deviceId;
  } else if (req.method === 'POST') {
    deviceId = req.body.deviceId;
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // Validation
  if (!deviceId) {
    return res.status(400).json({ 
      status: 'error', 
      message: 'Device ID is required' 
    });
  }
  
  if (typeof deviceId !== 'string' || deviceId.length < 10) {
    return res.status(400).json({ 
      status: 'error', 
      message: 'Invalid Device ID format' 
    });
  }
  
  try {
    // Load approved users
    const approvedUsers = await getApprovedUsers();
    
    // Find user by deviceId
    const user = approvedUsers.find(u => u.deviceId === deviceId);
    
    if (!user) {
      // Device not found in approved list
      return res.json({
        status: 'pending',
        deviceId: deviceId,
        message: 'Device not approved yet. Please contact admin.',
        suggestedAction: 'Send your Device ID to admin for approval'
      });
    }
    
    // Check expiry date
    const today = new Date();
    const expiryDate = new Date(user.expires);
    
    if (expiryDate < today) {
      // Subscription expired
      return res.json({
        status: 'expired',
        deviceId: deviceId,
        expires: user.expires,
        message: `Your access expired on ${user.expires}`,
        contact: 'Please renew your subscription'
      });
    }
    
    // ✅ ACCESS GRANTED
    return res.json({
      status: 'approved',
      deviceId: deviceId,
      expires: user.expires,
      registeredAt: user.registeredAt || new Date().toISOString().split('T')[0],
      name: user.name || 'User',
      message: 'Access granted',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error checking access:', error);
    
    // Fallback response if something goes wrong
    return res.status(200).json({
      status: 'checking',
      deviceId: deviceId,
      message: 'System is checking your access. Please wait.',
      offlineMode: true
    });
  }
}

// Function to get approved users
async function getApprovedUsers() {
  try {
    // Method 1: Fetch from GitHub (recommended)
    // မင်း GitHub repo ထဲမှာ approved_users.json ဖိုင်ရှိရမယ်
    const response = await fetch('https://tv-version-six.vercel.app/approved_users.json');
    
    if (response.ok) {
      const data = await response.json();
      return data.users || [];
    }
    
    // Method 2: Fallback to hardcoded list
    return [
      {
        deviceId: "S4TV_KBHCZL_D2B0",  // ဒီက ID ကို မင်း generate လုပ်တဲ့ ID နဲ့အစားထိုး
        expires: "2026-05-31",
        registeredAt: "2024-01-01",
        name: "Admin Account"
      },
      {
        deviceId: "S4TV_3A7B1C4D_EF8",
        expires: "2024-06-30", 
        registeredAt: "2024-01-15",
        name: "Test User"
      }
    ];
    
  } catch (error) {
    console.log('Using fallback approved users list');
    
    // Emergency fallback
    return [
      {
        deviceId: "S4TV_EMERGENCY_123",
        expires: "2099-12-31",
        registeredAt: "2024-01-01",
        name: "Emergency Access"
      }
    ];
  }
      }
