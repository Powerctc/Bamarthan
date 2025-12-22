// api/check-access.js
import fs from 'fs';
import path from 'path';

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
    // Read from approved_users.json
    const filePath = path.join(process.cwd(), 'approved_users.json');
    const fileData = fs.readFileSync(filePath, 'utf8');
    const approvedUsers = JSON.parse(fileData);
    
    console.log('📁 Approved users loaded:', approvedUsers.length);
    
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
    
  } catch (error) {
    console.error('❌ Error reading user data:', error);
    
    // If file doesn't exist or is empty
    return res.status(500).json({
      status: 'error',
      message: 'Server error while checking access',
      details: error.message
    });
  }
      }
