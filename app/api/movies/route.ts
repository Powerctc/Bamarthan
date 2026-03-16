// app/api/movies/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
  const referer = request.headers.get('referer');
  const host = request.headers.get('host');

  // ၁။ တခြား website ကနေ လှမ်းယူတာကို ပိတ်မယ်
  // (Localhost မှာ စမ်းနေရင် referer က ရှိမှာမဟုတ်လို့ development မှာတော့ ဒါကို ခဏပိတ်ထားနိုင်ပါတယ်)
  if (!referer || !referer.includes(host || '')) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized access" }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // ၂။ JSON ဖိုင်ကို Server-side ကနေပဲ ဖတ်မယ်
    const filePath = path.join(process.cwd(), 'data', 'zetflix.json');
    const jsonData = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(jsonData);

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Data not found" }, { status: 404 });
  }
}
