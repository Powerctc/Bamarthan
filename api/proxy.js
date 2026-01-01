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

    // Playlist (.m3u8) ဖြစ်ခဲ့ရင်
    if (url.includes('.m3u8')) {
      let text = await response.text();
      const origin = new URL(url).origin;
      const urlObj = new URL(url);
      const basePath = urlObj.href.substring(0, urlObj.href.lastIndexOf('/') + 1);

      // Playlist ထဲက Relative Links တွေကို Full URL ပြောင်းပေးခြင်း (Player နားလည်အောင်)
      text = text.replace(/^(?!http)(.*)$/mg, (match) => {
        if (match.trim() === '' || match.startsWith('#')) return match;
        return match.startsWith('/') ? origin + match : basePath + match;
      });

      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl'); // ဒါမှ Player က ဗီဒီယိုမှန်းသိမှာ
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.send(text);
    }

    // တခြား Video Data (.ts chunks) တွေအတွက်
    const arrayBuffer = await response.arrayBuffer();
    res.setHeader('Content-Type', response.headers.get('content-type') || 'video/mp2t');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.send(Buffer.from(arrayBuffer));

  } catch (error) {
    return res.status(500).send('Proxy Error: ' + error.message);
  }
}
