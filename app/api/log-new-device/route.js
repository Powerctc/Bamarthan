export async function POST(request) {
  try {
    const { deviceId } = await request.json();
    if (!deviceId || deviceId.length !== 12) {
      return new Response(JSON.stringify({ error: 'Invalid ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    console.log(`[NEW_AUTO_USER] Device ID: ${deviceId} | Time: ${new Date().toISOString()}`);
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Log failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
