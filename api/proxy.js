export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).send('Missing URL');

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': new URL(url).origin,
        'Origin': new URL(url).origin
      }
    });

    if (url.includes('.m3u8')) {
      let text = await response.text();
      const urlObj = new URL(url);
      const origin = urlObj.origin;
      const basePath = url.substring(0, url.lastIndexOf('/') + 1);

      // playlist ထဲက link တိုင်းကို ကိုယ့် Proxy ဆီ ပြန်လှည့်ပေးတာပါ (ဒါမှ VPN မလိုမှာ)
      text = text.replace(/^(?!http)(.*)$/mg, (match) => {
        if (match.trim() === '' || match.startsWith('#')) return match;
        const fullUrl = match.startsWith('/') ? origin + match : basePath + match;
        return `/api/proxy?url=${encodeURIComponent(fullUrl)}`;
      });

      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(200).send(text);
    }

    // Video (.ts) chunks တွေကို Vercel ကနေ ပို့ပေးမယ်
    const data = await response.arrayBuffer();
    res.setHeader('Content-Type', response.headers.get('content-type') || 'video/mp2t');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.send(Buffer.from(data));

  } catch (error) {
    return res.status(500).send('Error: ' + error.message);
  }
  }
