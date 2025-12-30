// app/api/approve/route.js
import { NextResponse } from 'next/server';

// ⚠️ Environment variable အမည်ကို Vercel နှင့် တိကျစွာကိုက်ညီအောင်
const HF_TOKEN = process.env.HF_TOKEN;
const APPROVE_SECRET = process.env.HF_APPROVE_SECRET; // 👈 ဒီနာမည်ကိုသုံးနေပါသလား?

const HF_USERNAME = 's4itmm';
const HF_SPACE = 'm-sport-download';
const FILE_PATH = 'approved_users.json';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const deviceId = searchParams.get('id');
  const secret = searchParams.get('secret');
  const name = searchParams.get('name') || 'Auto Approved';

  // 🔒 Secret စစ်ဆေးခြင်း
  if (secret !== APPROVE_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  // 📱 Device ID စစ်ဆေးခြင်း
  if (!deviceId || deviceId.length !== 12 || !/^\d+$/.test(deviceId)) {
    return NextResponse.json({ error: 'Invalid device ID' }, { status: 400 });
  }

  try {
    // 1. လက်ရှိ approved_users.json ကို ဖတ်ပါ
    const currentUrl = `https://${HF_SPACE}.static.hf.space/${FILE_PATH}`;
    let userList = [];
    try {
      const res = await fetch(currentUrl);
      if (res.ok) {
        const data = await res.json();
        userList = Array.isArray(data) ? data : [];
      }
    } catch (e) {
      console.warn('Starting with empty user list');
    }

    // 2. ပြီးသား approve ဖြစ်နေလျှင် ပြန်ပို့ပါ
    const exists = userList.some(user => user.id === deviceId);
    if (exists) {
      return NextResponse.json({ status: 'already_approved', id: deviceId });
    }

    // 3. 30 ရက် expiry ဖြင့် ထည့်ပါ
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 30);
    const newUser = {
      id: deviceId,
      name: name,
      expires: expiry.toISOString().split('T')[0],
    };

    userList.push(newUser);

    // 4. Hugging Face ကို update လုပ်ပါ
    const commitRes = await fetch(
      `https://huggingface.co/api/spaces/${HF_USERNAME}/${HF_SPACE}/commit/main`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commit_title: `Auto-approve: ${deviceId}`,
          operations: [
            {
              operation: 'change',
              path: FILE_PATH,
              content: JSON.stringify(userList, null, 2),
            },
          ],
        }),
      }
    );

    if (!commitRes.ok) {
      const errText = await commitRes.text();
      console.error('HF commit failed:', errText);
      return NextResponse.json({ error: 'Auto-approve failed' }, { status: 500 });
    }

    return NextResponse.json({ status: 'approved', user: newUser });

  } catch (err) {
    console.error('Auto-approve error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
