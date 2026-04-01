// api/state.js — Vercel Serverless Function
// GET /api/state?user_id=fb2_real  → load state from Supabase
// POST /api/state {user_id, state} → upsert state to Supabase

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    if (req.method === "GET") {
      const user_id = req.query.user_id;
      if (!user_id) return res.status(400).json({ error: "user_id required" });

      const { data, error } = await supabase
        .from("user_state")
        .select("state")
        .eq("user_id", user_id)
        .single();

      if (error && error.code !== "PGRST116") {
        return res.status(500).json({ error: error.message });
      }
      return res.status(200).json({ state: data?.state || null });
    }

    if (req.method === "POST") {
      const { user_id, state } = req.body;
      if (!user_id || !state) {
        return res.status(400).json({ error: "user_id and state required" });
      }

      const { error } = await supabase
        .from("user_state")
        .upsert({ user_id, state }, { onConflict: "user_id" });

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
