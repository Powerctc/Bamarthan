import { NextResponse } from 'next/server';
import movieData from '../../../src/data/zetflix.json'; 

export async function GET(request) {
  const referer = request.headers.get('referer');
  const host = request.headers.get('host') || "";

  if (!referer || !referer.includes(host)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  return NextResponse.json(movieData);
}
