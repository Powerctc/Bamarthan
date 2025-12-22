// /api/register-device.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method === 'POST') {
    const { deviceId, name, contact } = req.body;
    
    // Here you would save to a database
    // For now, just return success
    
    console.log('New device registration:', { deviceId, name, contact });
    
    return res.json({
      success: true,
      message: 'Registration received',
      deviceId,
      note: 'Please wait for approval'
    });
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}
