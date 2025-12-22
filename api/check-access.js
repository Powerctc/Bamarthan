// /api/check-access.js
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method === 'POST') {
    try {
      const { deviceId, appName, version } = req.body;
      
      // Validate input
      if (!deviceId || !appName) {
        return res.status(400).json({
          status: 'error',
          message: 'Missing required fields'
        });
      }
      
      // ဒီနေရာမှာ Database ကနေ check မယ်
      // အခုအတွက် approved_users.json ဖိုင်ကိုသုံးမယ်
      
      // Fetch approved users list
      const approvedUsers = await fetchApprovedUsers();
      
      // Check if device is approved
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
          message: `Your subscription expired on ${user.expires}`
        });
      }
      
      // Approved!
      return res.json({
        status: 'approved',
        deviceId,
        expires: user.expires,
        registeredAt: user.registeredAt,
        message: 'Access granted'
      });
      
    } catch (error) {
      console.error('Error checking access:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Internal server error'
      });
    }
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}

// Fetch approved users from file or database
async function fetchApprovedUsers() {
  try {
    // Method 1: From GitHub file (recommended)
    const response = await fetch('https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/approved_users.json');
    const data = await response.json();
    return data.users || [];
    
    // Method 2: Hardcoded (for testing)
    /*
    return [
      {
        deviceId: "s4_123456789",
        expires: "2024-12-31",
        registeredAt: "2024-01-01",
        name: "Test User"
      }
    ];
    */
  } catch (error) {
    console.error('Error fetching approved users:', error);
    return [];
  }
}
