// api/proxy.js
export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).send('Missing URL');

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': new URL(url).origin
      }
    });

    const contentType = response.headers.get('content-type');
    let data = await response.text();

    // အရေးကြီးဆုံးအပိုင်း: .m3u8 ထဲက Link တွေကို Proxy Link အဖြစ် ပြောင်းပေးခြင်း
    if (url.includes('.m3u8')) {
      const baseUrl = url.substring(0, url.lastIndexOf('/') + 1);
      
      // .ts link တွေ ဒါမှမဟုတ် အခြား m3u8 link တွေကို ရှာပြီး Proxy ခံပေးတာပါ
      data = data.replace(/^(?!http)(.*)$/mg, (match) => {
        if (match.trim() === '' || match.startsWith('#')) return match;
        const fullUrl = new URL(match, baseUrl).href;
        return `/api/proxy?url=${encodeURIComponent(fullUrl)}`;
      });
    }

    res.setHeader('Content-Type', contentType || 'application/vnd.apple.mpegurl');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(data);
  } catch (error) {
    res.status(500).send('Stream Proxy Error');
  }
}
