export default async function handler(req, res) {
  // CORS error မတက်အောင် Preflight (OPTIONS) request ကိုပါ လက်ခံပေးဖို့ လိုအပ်နိုင်ပါတယ်
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Environment Variable ထဲကနေ URL ကို ဆွဲယူခြင်း
  const targetUrl = process.env.MATCHES_API_URL;

  if (!targetUrl) {
    return res.status(500).json({ error: 'API URL is not configured in environment variables' });
  }

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
