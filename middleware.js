import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const referer = request.headers.get('referer') || '';
  const host = request.headers.get('host') || '';

  // ၁။ ပေးဖြတ်မည့် လမ်းကြောင်းများ (Public Routes)
  // Verification Page (index.html) နဲ့ လိုအပ်တဲ့ static file တွေကို ပေးဖြတ်ရပါမယ်
  if (
    pathname === '/' || 
    pathname.startsWith('/index.html') || 
    pathname.startsWith('/Chat/Group.html') ||
    pathname === '/sw.js' ||
    pathname === '/offline.html' ||
    pathname.includes('.') // file extension ပါရင် ပေးဖြတ်မယ် (images/css)
  ) {
    return NextResponse.next();
  }

  // ၂။ Web Security: Referer စစ်ဆေးခြင်း
  // မိမိ Website ရဲ့ Domain ကနေ လာတာ မဟုတ်ရင် တားဆီးမယ်
  const isInternalRequest = referer.includes(host);

  if (!isInternalRequest) {
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html lang="my">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Access Restricted</title>
          <style>
              body { background-color: #0f172a; color: white; font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; text-align: center; }
              .container { padding: 30px; border: 1px solid #1e293b; border-radius: 20px; background: #1e293b; box-shadow: 0 10px 25px rgba(0,0,0,0.5); max-width: 350px; }
              h1 { color: #facc15; font-size: 22px; margin-bottom: 15px; }
              p { font-size: 14px; line-height: 1.6; color: #94a3b8; }
              .btn { display: inline-block; margin-top: 20px; padding: 12px 24px; background: #facc15; color: #000; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 13px; }
          </style>
      </head>
      <body>
          <div class="container">
              <h1>Access Restricted</h1>
              <p>ဤစာမျက်နှာကို တိုက်ရိုက်ဝင်ရောက်၍မရပါ။ <br> ကျေးဇူးပြု၍ ပင်မစာမျက်နှာမှတဆင့် ဝင်ရောက်ပေးပါ။</p>
              <a href="/" class="btn">ပင်မစာမျက်နှာသို့သွားရန်</a>
          </div>
      </body>
      </html>
      `,
      {
        status: 403,
        headers: { 'content-type': 'text/html; charset=utf-8' },
      }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * အောက်ပါ paths များမှလွဲ၍ ကျန်တာအားလုံးကို middleware စစ်မည်:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|index.html|Chat/Group.html|sw.js|offline.html).*)',
  ],
};
  
