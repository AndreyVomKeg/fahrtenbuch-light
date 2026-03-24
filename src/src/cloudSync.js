// src/cloudSync.js — Cloud sync via Supabase
// Monkey-patches localStorage.setItem to intercept fb2_real / fb2_demo writes.
// Debounced (3s) save to /api/state. On startup: restore from cloud if localStorage empty.

const SYNC_KEYS = ["fb2_real", "fb2_demo"];
const DEBOUNCE_MS = 3000;

let saveTimer = null;

function debounceCloudSave(key, value) {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    try {
      await fetch("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: key, state: JSON.parse(value) }),
      });
    } catch (e) {
      // Silent fail — localStorage is the source of truth
    }
  }, DEBOUNCE_MS);
}

// Monkey-patch localStorage.setItem
try {
  const originalSetItem = localStorage.setItem.bind(localStorage);
  localStorage.setItem = function (key, value) {
    originalSetItem(key, value);
    if (SYNC_KEYS.includes(key)) {
      debounceCloudSave(key, value);
    }
  };
} catch (e) {
  // localStorage not available (e.g. Claude.ai artifact) — skip silently
}

// On startup: restore from cloud if localStorage is empty
async function restoreFromCloud() {
  try {
    for (const key of SYNC_KEYS) {
      const local = localStorage.getItem(key);
      if (local) continue; // already have data locally

      const res = await fetch(`/api/state?user_id=${key}`);
      if (!res.ok) continue;

      const { state } = await res.json();
      if (state) {
        const original = localStorage.setItem.__original || localStorage.setItem;
        // Use native setItem to avoid re-triggering cloud save
        Object.getPrototypeOf(localStorage).setItem.call(localStorage, key, JSON.stringify(state));
      }
    }
  } catch (e) {
    // Silent fail — app will use defaults
  }
}

// Run restore (non-blocking)
if (typeof localStorage !== "undefined") {
  restoreFromCloud();
}
