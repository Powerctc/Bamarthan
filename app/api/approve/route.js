// app/api/approve/route.js
import { NextResponse } from 'next/server';

const HF_TOKEN = process.env.HF_TOKEN; // from Vercel env
const HF_USERNAME = 's4itmm'; // သင့် HF username
const HF_SPACE = 'm-sport-download'; // သင့် space name
const FILE_PATH = 'approved_users.json';

const APPROVE_SECRET = process.env.APPROVE_SECRET;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const deviceId = searchParams.get('id');
  const secret = searchParams.get('secret');

  // 🔒 Secret စစ်ဆေးပါ
  if (secret !== APPROVE_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  // 📱 Device ID စစ်ဆေးပါ
  if (!deviceId || deviceId.length !== 12 || !/^\d+$/.test(deviceId)) {
    return NextResponse.json({ error: 'Invalid device ID' }, { status: 400 });
  }

  try {
    // 1️⃣ လက်ရှိ approved_users.json ကို fetch လုပ်ပါ
    const currentUrl = `https://${HF_SPACE}.static.hf.space/${FILE_PATH}`;
    let userList = [];
    try {
      const res = await fetch(currentUrl);
      if (res.ok) {
        const data = await res.json();
        userList = Array.isArray(data) ? data : [];
      }
    } catch (e) {
      console.warn('Failed to load current approved_users.json, starting fresh');
    }

    // 2️⃣ ဒီ device ID ကို ထပ်မထည့်ပါနှင့် (already approved ဖြစ်နိုင်)
    const exists = userList.some(user => user.id === deviceId);
    if (exists) {
      return NextResponse.json({ status: 'already_approved', id: deviceId });
    }

    // 3️⃣ 30 ရက် expiry ဖြင့် ထည့်ပါ
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 30);
    const newUser = {
      id: deviceId,
      approved_at: new Date().toISOString(),
      expiry: expiry.toISOString().split('T')[0],
    };

    userList.push(newUser);

    // 4️⃣ Hugging Face Space ကို Git commit လုပ်ပြီး update ပေးပါ
    const commitRes = await fetch(
      `https://huggingface.co/api/spaces/${HF_USERNAME}/${HF_SPACE}/commit/main`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commit_title: `Approve device ${deviceId}`,
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
      return NextResponse.json({ error: 'Approval failed' }, { status: 500 });
    }

    return NextResponse.json({
      status: 'approved',
      id: deviceId,
      expiry: newUser.expiry,
    });
  } catch (err) {
    console.error('Auto-approve error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
                                 }
