// cloudSync.js — Transparent cloud persistence via /api/state
// Intercepts localStorage writes for fb2_real/fb2_demo and syncs to Supabase
// Import this file in main.jsx BEFORE App to activate

const WATCHED_KEYS = ['fb2_real', 'fb2_demo'];
let _cloudSaveTimer = null;

// Debounced cloud save
function saveToCloud(key, data) {
  clearTimeout(_cloudSaveTimer);
  _cloudSaveTimer = setTimeout(async () => {
    try {
      const resp = await fetch('/api/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: key, state: data })
      });
      if (resp.ok) console.log('[CloudSync] Saved', key);
      else console.warn('[CloudSync] Save error', resp.status);
    } catch (e) {
      console.warn('[CloudSync] Save failed:', e.message);
    }
  }, 3000); // 3s debounce
}

// Load from cloud (returns parsed state or null)
export async function loadFromCloud(key) {
  try {
    const resp = await fetch(`/api/state?user_id=${encodeURIComponent(key)}`);
    const { state } = await resp.json();
    return state || null;
  } catch (e) {
    console.warn('[CloudSync] Load failed:', e.message);
    return null;
  }
}

// Monkey-patch localStorage.setItem to intercept writes
const _origSetItem = localStorage.setItem.bind(localStorage);
localStorage.setItem = function(key, value) {
  _origSetItem(key, value);
  if (WATCHED_KEYS.includes(key)) {
    try {
      const parsed = JSON.parse(value);
      saveToCloud(key, parsed);
    } catch (e) { /* ignore non-JSON */ }
  }
};

// On startup: try to load cloud state if localStorage is empty
export async function initCloudSync() {
  for (const key of WATCHED_KEYS) {
    const local = localStorage.getItem(key);
    if (!local) {
      console.log('[CloudSync] No local data for', key, '- checking cloud...');
      const cloud = await loadFromCloud(key);
      if (cloud) {
        console.log('[CloudSync] Restoring from cloud:', key);
        _origSetItem(key, JSON.stringify(cloud));
      }
    }
  }
}

// Auto-init
initCloudSync().catch(e => console.warn('[CloudSync] Init error:', e));

console.log('[CloudSync] Module loaded — watching', WATCHED_KEYS.join(', '));
