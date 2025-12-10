
import { CommissionData, Preset } from '../types';

const DB_NAME = 'DohnaCommissionDB';
const STORE_NAME = 'presets';
const DB_VERSION = 2;
const SERVER_URL_KEY = 'dohna_server_url';

// --- Local IndexedDB Helper (Fallback/Cache) ---
export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('userId', 'userId', { unique: false });
      }
    };
  });
};

// --- Server Configuration ---
export const setServerUrl = (url: string) => {
  if (!url) {
    localStorage.removeItem(SERVER_URL_KEY);
  } else {
    // Remove trailing slash and ensure protocol
    let cleanUrl = url.replace(/\/$/, "");
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
        cleanUrl = 'https://' + cleanUrl;
    }
    localStorage.setItem(SERVER_URL_KEY, cleanUrl);
  }
};

export const getServerUrl = (): string | null => {
  return localStorage.getItem(SERVER_URL_KEY);
};

// --- CRUD Operations (Hybrid: Cloud First -> Local Fallback) ---

const saveLocal = async (preset: Preset) => {
  const db = await initDB();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(preset);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export const savePreset = async (userId: string, name: string, data: CommissionData): Promise<'cloud' | 'local'> => {
  const preset: Preset = {
    id: `${userId}_${Date.now()}`,
    userId,
    name,
    createdAt: Date.now(),
    data
  };

  // 1. ALWAYS Save Local First (Safety)
  try {
    await saveLocal(preset);
  } catch (e) {
    // Silent catch for local DB errors
  }

  const serverUrl = getServerUrl();

  // 2. Try Cloud Save (Best Effort)
  if (serverUrl) {
    try {
      const response = await fetch(`${serverUrl}/presets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preset),
      });
      
      if (!response.ok) {
        return 'local';
      }
      
      return 'cloud';
    } catch (e) {
      // Silent catch for network errors
      return 'local';
    }
  }

  return 'local';
};

export const getUserPresets = async (userId: string): Promise<{ presets: Preset[], source: 'cloud' | 'local' }> => {
  const serverUrl = getServerUrl();
  let cloudPresets: Preset[] | null = null;

  // 1. Try Cloud Fetch
  if (serverUrl) {
    try {
      const response = await fetch(`${serverUrl}/presets?userId=${encodeURIComponent(userId)}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
           data.sort((a: Preset, b: Preset) => b.createdAt - a.createdAt);
           cloudPresets = data;
        }
      }
    } catch (e) {
      // Silent catch
    }
  }

  if (cloudPresets) {
      return { presets: cloudPresets, source: 'cloud' };
  }

  // 2. Local Fetch
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('userId');
      const request = index.getAll(IDBKeyRange.only(userId));
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const results = request.result as Preset[];
        results.sort((a, b) => b.createdAt - a.createdAt);
        resolve({ presets: results, source: 'local' });
      };
    });
  } catch (err) {
    throw err;
  }
};

export const deletePreset = async (id: string): Promise<void> => {
  const serverUrl = getServerUrl();

  // Best effort cloud delete
  if (serverUrl) {
    try {
      await fetch(`${serverUrl}/presets?id=${id}`, { method: 'DELETE' });
    } catch (e) {
      // Silent catch
    }
  }

  // Always delete local
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (err) {
    throw err;
  }
};

// Legacy
export const savePresetToDB = async (key: string, data: any): Promise<void> => {
   await savePreset('default', key, data);
};

export const loadPresetFromDB = async (key: string): Promise<any> => {
    try {
        const db = await initDB();
        return new Promise((resolve, reject) => {
          const transaction = db.transaction(STORE_NAME, 'readonly');
          const store = transaction.objectStore(STORE_NAME);
          const request = store.get(key);
          request.onerror = () => reject(request.error);
          request.onsuccess = () => resolve(request.result?.data);
        });
    } catch (err) {
        throw err;
    }
};
