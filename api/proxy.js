export default async function handler(req, res) {
  const { url } = req.query;
  
  // Google Safe Browsing Bot တွေကို Proxy ထဲ ပေးမဝင်အောင် တားဆီးခြင်း
  const userAgent = req.headers['user-agent'] || '';
  if (userAgent.includes('Googlebot') || userAgent.includes('AdsBot-Google')) {
    return res.status(403).send('Bot not allowed');
  }

  if (!url) return res.status(400).send('Missing URL');

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': new URL(url).origin
      }
    });

    // m3u8 playlist ပြင်ဆင်ခြင်း
    if (url.includes('.m3u8')) {
      let text = await response.text();
      const urlObj = new URL(url);
      const basePath = url.substring(0, url.lastIndexOf('/') + 1);

      text = text.replace(/^(?!http)(.*)$/mg, (match) => {
        if (match.trim() === '' || match.startsWith('#')) return match;
        const fullUrl = match.startsWith('/') ? urlObj.origin + match : basePath + match;
        return `/api/proxy?url=${encodeURIComponent(fullUrl)}`;
      });

      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      // လုံခြုံရေး Header အချို့ထည့်ပေးခြင်း
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(200).send(text);
    }

    const data = await response.arrayBuffer();
    res.setHeader('Content-Type', response.headers.get('content-type') || 'video/mp2t');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).send(Buffer.from(data));

  } catch (error) {
    return res.status(500).send('Proxy Error');
  }
      }
