// app/api/auto-register/route.js
export async function POST(request) {
  try {
    const { deviceId } = await request.json();

    if (!deviceId || deviceId.length !== 12) {
      return Response.json({ error: 'Invalid device ID' }, { status: 400 });
    }

    // Check if already registered
    const existing = await KV.get(`auto_${deviceId}`);
    if (existing) {
      return Response.json(JSON.parse(existing));
    }

    // Auto-approve with 1-year expiry
    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 1);
    const expiresStr = expiry.toISOString().split('T')[0]; // YYYY-MM-DD

    const user = {
      id: deviceId,
      name: `Auto ${new Date().toLocaleDateString('en-GB')}`,
      expires: expiresStr
    };

    // Save to Vercel KV (key: auto_012345678901)
    await KV.set(`auto_${deviceId}`, JSON.stringify(user), { expirationTtl: 31536000 }); // 1 year

    return Response.json(user);
  } catch (e) {
    console.error('Auto-register error:', e);
    return Response.json({ error: 'Registration failed' }, { status: 500 });
  }
}
