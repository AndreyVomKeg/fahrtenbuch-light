// Vercel Serverless Function — Claude API Proxy
// Скрывает ANTHROPIC_API_KEY от клиента

// ─── CORS: разрешённые домены ────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  "https://fahrtenbuch-light.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:3000",
];

function setCors(req, res) {
  const origin = req.headers.origin || "";
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

// ─── Simple in-memory rate limiter (per IP, 20 req / 60s) ───────────────────
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 20;
const ipHits = new Map();

function checkRateLimit(req) {
  const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();
  let entry = ipHits.get(ip);
  if (!entry || now - entry.start > RATE_WINDOW_MS) {
    entry = { start: now, count: 0 };
    ipHits.set(ip, entry);
  }
  entry.count++;
  // Clean up old entries periodically
  if (ipHits.size > 5000) {
    for (const [k, v] of ipHits) {
      if (now - v.start > RATE_WINDOW_MS) ipHits.delete(k);
    }
  }
  return entry.count <= RATE_MAX;
}

export default async function handler(req, res) {
  setCors(req, res);

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  if (!checkRateLimit(req)) {
    return res.status(429).json({ error: "Too many requests — bitte warten" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured" });

  try {
    const { messages, system, tools, max_tokens } = req.body;

    const body = {
      model: "claude-sonnet-4-6",
      max_tokens: max_tokens || 1000,
      messages,
    };
    if (system) body.system = system;
    if (tools)  body.tools = tools;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error("Claude API error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
