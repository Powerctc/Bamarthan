import { NextResponse } from 'next/server';
// app/api/movies မှသည် src/data သို့ လှမ်းချိတ်ခြင်း
import movieData from '../../../src/data/zetflix.json'; 

export async function GET(request) {
  const referer = request.headers.get('referer');
  const host = request.headers.get('host') || "";

  // ကိုယ့် website domain ကလာတာဟုတ်မှ ပေးကြည့်မယ်
  if (!referer || !referer.includes(host)) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
  }

  return NextResponse.json(movieData);
}
