export interface StorageAdapter {
  get: (keys: string[]) => Promise<Record<string, any>>;
  set: (items: Record<string, any>) => Promise<void>;
}

export class ChromeStorageAdapter implements StorageAdapter {
  async get(keys: string[]) {
    if (typeof chrome !== "undefined" && chrome.storage) {
      return chrome.storage.local.get(keys);
    }
    throw new Error("Chrome storage not available");
  }

  async set(items: Record<string, any>) {
    if (typeof chrome !== "undefined" && chrome.storage) {
      return chrome.storage.local.set(items);
    }
    throw new Error("Chrome storage not available");
  }
}

export class LocalStorageAdapter implements StorageAdapter {
  async get(keys: string[]) {
    const result: Record<string, any> = {};
    keys.forEach((key) => {
      const value = localStorage.getItem(key);
      if (value) {
        result[key] = JSON.parse(value);
      }
    });
    return result;
  }

  async set(items: Record<string, any>) {
    Object.entries(items).forEach(([key, value]) => {
      localStorage.setItem(key, JSON.stringify(value));
    });
  }
}
