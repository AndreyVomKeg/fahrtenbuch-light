// Vercel Serverless Function — Claude API Proxy
// ANTHROPIC_API_KEY

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });

  try {
    const { messages, system, tools, max_tokens } = req.body;

    // Filter out non-standard tool types (e.g. web_search_20250305) and deduplicate by name
    let cleanTools = tools;
    if (Array.isArray(tools)) {
      // Remove tools with non-standard type (only keep type:'custom' or no type, i.e. standard function tools)
      cleanTools = tools.filter(t => !t.type || t.type === 'custom' || t.type === 'function');
      // Deduplicate by name - keep last occurrence
      const seen = new Map();
      for (const t of cleanTools) {
        seen.set(t.name, t);
      }
      cleanTools = Array.from(seen.values());
    }

    const body = {
      model: 'claude-sonnet-4-20250514',
      max_tokens: max_tokens || 1000,
      messages,
    };

    if (system) body.system = system;
    if (cleanTools && cleanTools.length > 0) body.tools = cleanTools;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('Anthropic API error:', response.status, JSON.stringify(data));
      return res.status(response.status).json(data);
    }
    return res.status(200).json(data);
  } catch (err) {
    console.error('Claude API error:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
}
