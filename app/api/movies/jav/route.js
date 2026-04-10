import { NextResponse } from 'next/server';

export async function GET(request) {
  const referer = request.headers.get('referer');
  const host = request.headers.get('host');

  // ၁။ တခြား website များ ခိုးသုံးခြင်းမှ ကာကွယ်ရန် (Security Check)
  if (!referer || !referer.includes(host)) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
  }

  // ၂။ အပြင် API Link များ
  const apiLinks = [
    "https://livesportmm-lotayamovies.hf.space/api/movies",
    "https://livesportmm-lotayamovies-2.hf.space/api/movies"
  ];

  try {
    let allMovies = [];

    // ၃။ API တစ်ခုချင်းစီကို လှမ်းခေါ်ပြီး ၅ ကားစီ စစ်ထုတ်ခြင်း
    for (const url of apiLinks) {
      const res = await fetch(url);
      const data = await res.json();
      
      // ၅ ကားပဲ ယူပြီး စာရင်းထဲ ထည့်မယ်
      const limited = data.slice(0, 5);
      allMovies = [...allMovies, ...limited];
    }

    // ၄။ စုစုပေါင်း ၁၀ ကား (၅ ကားစီ) ကို JSON ပြန်ထုတ်ပေးခြင်း
    return NextResponse.json(allMovies);

  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}
