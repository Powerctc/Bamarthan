// api/check-access.js - UPDATED VERSION
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Get device ID from query or body
  let deviceId;
  if (req.method === 'GET') {
    deviceId = req.query.deviceId;
  } else if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      deviceId = body.deviceId;
    } catch (e) {
      deviceId = null;
    }
  }
  
  console.log('🔍 Access check for device:', deviceId);
  
  // Validate device ID
  if (!deviceId || typeof deviceId !== 'string' || deviceId.length < 10) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid device ID',
      timestamp: new Date().toISOString()
    });
  }
  
  try {
    // ✅ မင်း Device ID ကို ဒီမှာ ထည့်ပါ
    const approvedUsers = [
      {
        deviceId: "S4TV_KBHCZL_D2B0",  // ✅ မင်း Device ID
        expires: "2025-12-31",         // ✅ Future date ဖြစ်ရမယ်
        registeredAt: "2024-01-20",
        name: "Admin",
        package: "Premium",
        notes: "Primary account"
      }
    ];
    
    // Find the user
    const user = approvedUsers.find(u => u.deviceId === deviceId);
    
    if (!user) {
      // Device not in approved list
      return res.json({
        status: 'pending',
        deviceId: deviceId,
        message: 'Device not approved. Please contact admin.',
        timestamp: new Date().toISOString(),
        currentDate: new Date().toISOString().split('T')[0]
      });
    }
    
    // Check if expired
    const today = new Date();
    const expiryDate = new Date(user.expires);
    
    if (expiryDate < today) {
      // Subscription expired
      return res.json({
        status: 'expired',
        deviceId: deviceId,
        expires: user.expires,
        registeredAt: user.registeredAt,
        message: `Your access expired on ${user.expires}. Please renew.`,
        timestamp: new Date().toISOString(),
        currentDate: today.toISOString().split('T')[0]
      });
    }
    
    // ✅ ACCESS GRANTED
    return res.json({
      status: 'approved',
      deviceId: deviceId,
      expires: user.expires,
      registeredAt: user.registeredAt,
      name: user.name,
      package: user.package,
      message: 'Access granted',
      timestamp: new Date().toISOString(),
      currentDate: today.toISOString().split('T')[0],
      daysRemaining: Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24))
    });
    
  } catch (error) {
    console.error('Error in check-access:', error);
    
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
      }
