export default async function handler(req, res) {
  // ၁။ ခွင့်ပြုမယ့် မိမိ Website Domain ကို ဒီမှာ ပြောင်းထည့်ပါ (Slash '/' မပါရပါ)
  // ဥပမာ - 'https://yourwebsite.com' သို့မဟုတ် ပရောဂျက်စမ်းနေစဉ်အတွင်း 'http://localhost:3000'
  const allowedOrigin = 'https://fotlivemovies.vercel.app'; 

  const origin = req.headers.origin || req.headers.referer;

  // CORS Error မတက်အောင် ခွင့်ပြုထားတဲ့ Domain တစ်ခုတည်းကိုပဲ ပေးသိမည့် Header ထည့်ခြင်း
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Content-Type', 'application/json');

  // Browser ကနေ ပထမဆုံး စစ်ဆေးတတ်တဲ့ OPTIONS (Preflight) Request ကို ခွင့်ပြုပေးခြင်း
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  // ၂။ တခြား Website တွေက လှမ်းခေါ်ရင် Block ဖို့အတွက် Origin ကို စစ်ဆေးခြင်း
  if (!origin || !origin.startsWith(allowedOrigin)) {
    return res.status(403).json({ error: 'Access Denied: Unauthorized website domain.' });
  }

  const targetUrl = 'https://raw.githubusercontent.com/devxseven/mdata/refs/heads/main/matches.json';

  try {
    const response = await fetch(targetUrl);
    
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch data' });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
