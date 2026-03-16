// middleware.js
import { NextResponse } from 'next/server';

export function middleware(request) {
  const referer = request.headers.get('referer');
  const host = request.headers.get('host') || "";

  // API လမ်းကြောင်းတွေကို စစ်ဆေးမယ်
  if (request.nextUrl.pathname.startsWith('/api')) {
    // Referer မပါရင် ဒါမှမဟုတ် ကိုယ့် Domain မဟုတ်ရင် ပိတ်မယ်
    if (!referer || !referer.includes(host)) {
      return new NextResponse(
        JSON.stringify({ message: 'Unauthorized Access' }),
        { status: 403, headers: { 'content-type': 'application/json' } }
      );
    }
  }

  return NextResponse.next();
}

// API routes တွေအတွက်ပဲ middleware အလုပ်လုပ်အောင် ကန့်သတ်ထားမယ်
export const config = {
  matcher: '/api/:path*',
};
