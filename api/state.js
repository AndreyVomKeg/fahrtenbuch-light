// /api/state.js - Serverless function for Supabase state persistence
// Uses service_role key (server-side only, never exposed to client)

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SERVICE_KEY) {
    return res.status(500).json({ error: 'Supabase not configured' });
  }

  const supabaseRest = `${SUPABASE_URL}/rest/v1`;
  const headers = {
    'apikey': SERVICE_KEY,
    'Authorization': `Bearer ${SERVICE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };

  try {
    // GET - Load state for a user
    if (req.method === 'GET') {
      const { user_id } = req.query;
      if (!user_id) {
        return res.status(400).json({ error: 'user_id required' });
      }

      const resp = await fetch(
        `${supabaseRest}/user_state?user_id=eq.${encodeURIComponent(user_id)}&select=state,updated_at`,
        { headers }
      );
      const data = await resp.json();
      
      if (data.length === 0) {
        return res.status(200).json({ state: null });
      }
      return res.status(200).json({ state: data[0].state, updated_at: data[0].updated_at });
    }

    // POST - Save state for a user (upsert)
    if (req.method === 'POST') {
      const { user_id, state } = req.body;
      if (!user_id || !state) {
        return res.status(400).json({ error: 'user_id and state required' });
      }

      // Upsert: insert or update on conflict
      const resp = await fetch(
        `${supabaseRest}/user_state?on_conflict=user_id`,
        {
          method: 'POST',
          headers: { ...headers, 'Prefer': 'resolution=merge-duplicates,return=representation' },
          body: JSON.stringify({ user_id, state })
        }
      );
      const data = await resp.json();
      
      if (!resp.ok) {
        return res.status(resp.status).json({ error: data });
      }
      return res.status(200).json({ success: true, updated_at: data[0]?.updated_at });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('State API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
