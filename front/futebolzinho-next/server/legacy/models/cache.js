class Cache {
  constructor() {
    this.data = {};
  }

  get(key) {
    const entry = this.data[key];
    if (!entry) return null;
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      delete this.data[key];
      return null;
    }
    return entry.value;
  }

  set(key, value, ttlMs = 5 * 60 * 1000) {
    this.data[key] = {
      value,
      expiresAt: ttlMs ? Date.now() + ttlMs : null,
    };
  }

  clear() {
    this.data = {};
  }

  delete(key) {
    delete this.data[key];
  }

  deletePrefix(prefix) {
    Object.keys(this.data).forEach((key) => {
      if (key.startsWith(prefix)) {
        delete this.data[key];
      }
    });
  }
}

module.exports = new Cache();
