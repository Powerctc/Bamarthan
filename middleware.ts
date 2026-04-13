import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const rawUserAgent = request.headers.get('user-agent') || '';
  const userAgent = rawUserAgent.toLowerCase();

  // ၁။ ပေးဖြတ်မည့် လမ်းကြောင်းများ
  if (
    pathname.startsWith('/Chat/Group.html') || 
    pathname === '/sw.js' || 
    pathname === '/offline.html'
  ) {
    return NextResponse.next();
  }

  // ၂။ APK User Agent စစ်ဆေးခြင်း
  if (!userAgent.includes('s4itmm-tv-apk/2.0')) {
    // Access Denied ဖြစ်တဲ့အခါ ပြမယ့် HTML Design
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html lang="my">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Access Denied</title>
          <style>
              body { 
                  background-color: #121212; 
                  color: white; 
                  font-family: sans-serif; 
                  display: flex; 
                  justify-content: center; 
                  align-items: center; 
                  height: 100vh; 
                  margin: 0; 
                  text-align: center;
              }
              .container { padding: 20px; border: 1px solid #333; border-radius: 8px; background: #1e1e1e; }
              h1 { color: #ff4444; font-size: 24px; }
              p { font-size: 16px; line-height: 1.6; color: #ccc; }
              .warning { color: #ffbb33; font-weight: bold; }
          </style>
      </head>
      <body>
          <div class="container">
              <h1>Access Denied</h1>
              <p>Official APK အတွင်းမှသာ အသုံးပြုနိုင်ပါသည်။</p>
              <p class="warning">အကယ်၍ Official APK ထဲမှာ ဤစာတန်းပေါ်နေပါက <br> APK ကို <b>Clear Data</b> လုပ်ပြီး ပြန်ဝင်ပေးပါ။</p>
              <p style="font-size: 13px;">(VPN များကြောင့် ဖြစ်နိုင်ပါသည်)</p>
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
    '/((?!_next/static|_next/image|favicon.ico|Chat/Group.html|sw.js|offline.html).*)',
  ],
};
