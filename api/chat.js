export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }
  
  const API_KEY = process.env.API_KEY;
  const TARGET_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
  
  try {
    const response = await fetch(TARGET_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify(req.body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).send(errorText);
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    for await (const chunk of response.body) {
      res.write(chunk);
    }
    res.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
