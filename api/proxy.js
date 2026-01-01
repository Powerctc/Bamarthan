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
    
    // m3u8 playlist ဖြစ်ရင် အထဲက link တွေကို ပြင်မယ်
    if (url.includes('.m3u8')) {
      let data = await response.text();
      const origin = new URL(url).origin;
      const path = url.substring(0, url.lastIndexOf('/') + 1);

      // စာသားသက်သက် Proxy လို့ မပေါ်အောင် Link တွေကို Full Path ပြောင်းပေးခြင်း
      data = data.replace(/^(?!http)(.*)$/mg, (match) => {
        if (match.trim() === '' || match.startsWith('#')) return match;
        // Link က / နဲ့စရင် origin ကယူမယ်၊ မဟုတ်ရင် လက်ရှိ path ကယူမယ်
        const fullUrl = match.startsWith('/') ? origin + match : path + match;
        return fullUrl; // ဒီနေရာမှာ Proxy ပြန်မခံဘဲ မူရင်း Full URL ပဲ ပေးလိုက်တာ ပိုစိတ်ချရတယ်
      });

      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.send(data);
    }

    // တခြား file (ts chunks) တွေဆိုရင် တိုက်ရိုက် stream လုပ်ပေးမယ်
    const arrayBuffer = await response.arrayBuffer();
    res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(Buffer.from(arrayBuffer));

  } catch (error) {
    res.status(500).send('Proxy Error: ' + error.message);
  }
}
