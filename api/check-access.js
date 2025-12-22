// /api/check-access.js
export default async function handler(req, res) {
  // Allow all origins
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const { deviceId } = req.query;
  
  if (!deviceId) {
    return res.status(400).json({ 
      status: 'error', 
      message: 'Device ID required' 
    });
  }
  
  try {
    // Load approved users from GitHub (or hardcode)
    const approvedUsers = [
      { deviceId: "S4TV_ABC123_DEF", expires: "2024-12-31", name: "Test User 1" },
      { deviceId: "S4TV_XYZ789_ABC", expires: "2024-06-30", name: "Test User 2" }
    ];
    
    const user = approvedUsers.find(u => u.deviceId === deviceId);
    
    if (!user) {
      return res.json({
        status: 'pending',
        deviceId,
        message: 'Device not in approved list'
      });
    }
    
    // Check expiry
    const today = new Date();
    const expiry = new Date(user.expires);
    
    if (expiry < today) {
      return res.json({
        status: 'expired',
        deviceId,
        expires: user.expires,
        message: `Subscription expired on ${user.expires}`
      });
    }
    
    // Approved
    return res.json({
      status: 'approved',
      deviceId,
      expires: user.expires,
      message: 'Access granted',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
}
