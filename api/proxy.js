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

      // Playlist ထဲက link တွေကို Full URL အဖြစ်ပြောင်းပေးခြင်း
      text = text.replace(/^(?!http)(.*)$/mg, (match) => {
        if (match.trim() === '' || match.startsWith('#')) return match;
        return match.startsWith('/') ? origin + match : basePath + match;
      });

      // Player က ဒါကို Video လို့ သိအောင် Header ပေးခြင်း
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'no-cache');
      return res.status(200).send(text);
    }

    // Video Segment (.ts) ဖိုင်များအတွက်
    const arrayBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'video/mp2t';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).send(Buffer.from(arrayBuffer));

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
            }
