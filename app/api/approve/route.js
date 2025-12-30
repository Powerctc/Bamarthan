// app/api/approve/route.js
import { NextResponse } from 'next/server';

const HF_TOKEN = process.env.HF_TOKEN;
const HF_USERNAME = 's4itmm'; // 👈 သင့် HF username
const HF_SPACE = 'm-sport-download';
const FILE_PATH = 'approved_users.json';
const APPROVE_SECRET = process.env.HF_APPROVE_SECRET; // အကယ်၍ Vercel တွင် key က `APPROVE_SECRET` ဖြစ်နေပါက

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const deviceId = searchParams.get('id');
  const secret = searchParams.get('secret');
  const name = searchParams.get('name') || 'N/A';

  if (secret !== APPROVE_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  if (!deviceId || deviceId.length !== 12 || !/^\d+$/.test(deviceId)) {
    return NextResponse.json({ error: 'Invalid device ID' }, { status: 400 });
  }

  try {
    // Fetch current file
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

    // Check if already approved
    const exists = userList.some(user => user.id === deviceId);
    if (exists) {
      return NextResponse.json({ status: 'already_approved', id: deviceId });
    }

    // Add new user
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 30);
    const newUser = {
      id: deviceId,
      name: name,
      expires: expiry.toISOString().split('T')[0],
    };

    userList.push(newUser);

    // Update on Hugging Face
    const commitRes = await fetch(
      `https://huggingface.co/api/spaces/${HF_USERNAME}/${HF_SPACE}/commit/main`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commit_title: `Approve: ${deviceId}`,
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
      const err = await commitRes.text();
      console.error('HF update failed:', err);
      return NextResponse.json({ error: 'Failed to approve' }, { status: 500 });
    }

    return NextResponse.json({
      status: 'approved',
      user: newUser,
    });

  } catch (err) {
    console.error('Auto-approve error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
