// api/check-access.js
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
  
  // ✅ မင်း Device ID ကို ဒီမှာ ထည့်ပါ
  const approvedUsers = [
    {
      deviceId: "S4TV_KBHCZL_D2B0",  // ✅ မင်း Device ID
      expires: "2025-12-31",         // ✅ Future date
      registeredAt: "2024-01-20",
      name: "Admin",
      package: "Premium"
    }
  ];
  
  const user = approvedUsers.find(u => u.deviceId === deviceId);
  
  if (!user) {
    return res.json({
      status: 'pending',
      deviceId: deviceId,
      message: 'Device not approved. Please contact admin with your Device ID.'
    });
  }
  
  // Check expiry
  const today = new Date();
  const expiry = new Date(user.expires);
  
  if (expiry < today) {
    return res.json({
      status: 'expired',
      deviceId: deviceId,
      expires: user.expires,
      message: `Your subscription expired on ${user.expires}`
    });
  }
  
  // ✅ APPROVED
  return res.json({
    status: 'approved',
    deviceId: deviceId,
    expires: user.expires,
    name: user.name,
    package: user.package,
    message: 'Access granted'
  });
      }
