// middleware.ts
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const userAgent = request.headers.get('user-agent');

  // သင့် APK ကိုပဲ ခွင့်ပြုမယ်
  if (!userAgent?.includes('S4ITMM-TV-APK/1.0')) {
    // ဘာမှမပြဘဲ ချက်ချင်း ဖြတ်ပါ (သို့) အလွတ်စာမျက်နှာပြပါ
    return new NextResponse('', { status: 404 });
    // သို့မဟုတ်: return new NextResponse('Not Found', { status: 404 });
  }

  return NextResponse.next();
}

// အားလုံးကို တားမယ် (public ဖိုင်တွေကလွဲ)
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
