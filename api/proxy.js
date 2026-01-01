// api/proxy.js
export default async function handler(req, res) {
  const { b64 } = req.query; // 'url' အစား 'b64' ကို သုံးမယ်
  if (!b64) return res.status(400).send('Missing Data');

  try {
    // Base64 ကို မူရင်း URL ပြန်ပြောင်းခြင်း
    const url = Buffer.from(b64, 'base64').toString('utf-8');

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': new URL(url).origin
      }
    });

    if (url.includes('.m3u8')) {
      let text = await response.text();
      const origin = new URL(url).origin;
      const basePath = url.substring(0, url.lastIndexOf('/') + 1);

      text = text.replace(/^(?!http)(.*)$/mg, (match) => {
        if (match.trim() === '' || match.startsWith('#')) return match;
        const fullUrl = match.startsWith('/') ? origin + match : basePath + match;
        
        // Playlist ထဲက link တွေကိုလည်း base64 နဲ့ပဲ ပြန်လှည့်ပေးမယ်
        const encodedNext = Buffer.from(fullUrl).toString('base64');
        return `/api/proxy?b64=${encodedNext}`;
      });

      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(200).send(text);
    }

    const data = await response.arrayBuffer();
    res.setHeader('Content-Type', response.headers.get('content-type') || 'video/mp2t');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).send(Buffer.from(data));

  } catch (error) {
    return res.status(500).send('Error');
  }
}
