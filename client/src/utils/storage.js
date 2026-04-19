const PREFIX = 'gnp_';

export const storage = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      // Storage full or unavailable — ignore silently
    }
  },
  remove(key) {
    localStorage.removeItem(PREFIX + key);
  },
};
