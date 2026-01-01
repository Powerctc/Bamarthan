export default async function handler(req, res) {
  const targetUrl = 'https://raw.githubusercontent.com/devxseven/mdata/refs/heads/main/matches.json';

  try {
    const response = await fetch(targetUrl);
    
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch data' });
    }

    const data = await response.json();

    // CORS error မတက်အောင် Header ထည့်ပေးခြင်း
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
