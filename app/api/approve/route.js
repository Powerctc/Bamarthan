// app/api/approve/route.js
import { NextResponse } from 'next/server';

const HF_TOKEN = process.env.HF_TOKEN; // from Vercel env
const HF_USERNAME = 'M-SPORT';        // 👈 သင့် HF username
const HF_DATASET = 'Autoapproved';    // 👈 သင့် dataset name
const FILE_PATH = 'approved_users.json';
const APPROVE_SECRET = process.env.HF_APPROVE_SECRET; // must match Vercel env

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const deviceId = searchParams.get('id');
  const secret = searchParams.get('secret');
  const name = searchParams.get('name') || 'Auto Approved';

  if (secret !== APPROVE_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  if (!deviceId || deviceId.length !== 12 || !/^\d+$/.test(deviceId)) {
    return NextResponse.json({ error: 'Invalid device ID' }, { status: 400 });
  }

  try {
    // 🔽 1. Read current file from Dataset
    const currentUrl = `https://huggingface.co/datasets/${HF_USERNAME}/${HF_DATASET}/resolve/main/${FILE_PATH}`;
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

    // 🔽 2. Check if already approved
    const exists = userList.some(user => user.id === deviceId);
    if (exists) {
      return NextResponse.json({ status: 'already_approved', id: deviceId });
    }

    // 🔽 3. Add new user
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 30);
    const newUser = {
      id: deviceId,
      name: name,
      expires: expiry.toISOString().split('T')[0],
    };
    userList.push(newUser);

    // 🔽 4. Commit to Hugging Face Dataset
    const commitRes = await fetch(
      `https://huggingface.co/api/datasets/${HF_USERNAME}/${HF_DATASET}/commit/main`,
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
