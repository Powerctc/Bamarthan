// app/api/movies/route.js
import { NextResponse } from 'next/server';
import movieData from '@/data/zetflix.json'; 

export async function GET(request) {
  const referer = request.headers.get('referer');
  const host = request.headers.get('host') || "";

  // ကာကွယ်မှု: ကိုယ့် domain မဟုတ်ရင် ပိတ်မယ်
  if (!referer || !referer.includes(host)) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
  }

  return NextResponse.json(movieData);
}
