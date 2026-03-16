// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const referer = request.headers.get('referer');
  const allowedOrigin = 'https://yourwebsite.com';

  // API လမ်းကြောင်းဖြစ်ပြီး referer က ကိုယ့် domain မဟုတ်ရင် ပိတ်မယ်
  if (request.nextUrl.pathname.startsWith('/api')) {
    if (!referer || !referer.startsWith(allowedOrigin)) {
      return new NextResponse(
        JSON.stringify({ message: 'Forbidden access' }),
        { status: 403, headers: { 'content-type': 'application/json' } }
      );
    }
  }

  return NextResponse.next();
}
