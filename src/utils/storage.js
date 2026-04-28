import { DEFAULT_SETTINGS, STORAGE_KEYS } from "./constants.js";

function readJson(key, fallback) {
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be disabled in private or embedded browser contexts.
  }
}

export function loadSettings() {
  return { ...DEFAULT_SETTINGS, ...readJson(STORAGE_KEYS.settings, {}) };
}

export function saveSettings(settings) {
  writeJson(STORAGE_KEYS.settings, { ...DEFAULT_SETTINGS, ...settings });
}

export function getLeaderboard() {
  return readJson(STORAGE_KEYS.leaderboard, [])
    .filter((entry) => Number.isFinite(entry.score))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}

export function saveLeaderboardEntry(entry) {
  const next = [
    ...getLeaderboard(),
    {
      name: entry.name || "Learner",
      world: entry.world || "Universe",
      score: entry.score || 0,
      knowledge: entry.knowledge || 0,
      victory: Boolean(entry.victory),
      date: new Date().toISOString()
    }
  ]
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  writeJson(STORAGE_KEYS.leaderboard, next);
  return next;
}

export function getBestScore() {
  return getLeaderboard()[0]?.score || 0;
}
