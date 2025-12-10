
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
    // Remove trailing slash
    const cleanUrl = url.replace(/\/$/, "");
    localStorage.setItem(SERVER_URL_KEY, cleanUrl);
  }
};

export const getServerUrl = (): string | null => {
  return localStorage.getItem(SERVER_URL_KEY);
};

// --- CRUD Operations (Hybrid: Cloud First -> Local Fallback) ---

export const savePreset = async (userId: string, name: string, data: CommissionData): Promise<void> => {
  const preset: Preset = {
    id: `${userId}_${Date.now()}`,
    userId,
    name,
    createdAt: Date.now(),
    data
  };

  const serverUrl = getServerUrl();

  // 1. Try Cloud Save
  if (serverUrl) {
    try {
      const response = await fetch(`${serverUrl}/presets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preset),
      });
      if (!response.ok) throw new Error(`Server Error: ${response.status}`);
      // If server save is successful, we can optionally save to local as cache, 
      // but let's assume server is source of truth for now.
      // We still save to local to keep them in sync if the user switches modes
      await saveLocal(preset); 
      return;
    } catch (e) {
      console.error("Cloud save failed, falling back to local:", e);
      alert("⚠️ Cloud save failed. Saving locally only.");
    }
  }

  // 2. Local Save (Default or Fallback)
  await saveLocal(preset);
};

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

export const getUserPresets = async (userId: string): Promise<Preset[]> => {
  const serverUrl = getServerUrl();

  // 1. Try Cloud Fetch
  if (serverUrl) {
    try {
      const response = await fetch(`${serverUrl}/presets?userId=${encodeURIComponent(userId)}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      if (!response.ok) throw new Error(`Server Error: ${response.status}`);
      
      const data = await response.json();
      // Expecting array of presets
      if (Array.isArray(data)) {
         data.sort((a: Preset, b: Preset) => b.createdAt - a.createdAt);
         return data;
      }
    } catch (e) {
      console.error("Cloud fetch failed, using local:", e);
      // Fallthrough to local
    }
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
        resolve(results);
      };
    });
  } catch (err) {
    throw err;
  }
};

export const deletePreset = async (id: string): Promise<void> => {
  const serverUrl = getServerUrl();

  if (serverUrl) {
    try {
      // Assuming DELETE /presets?id=XYZ or /presets/XYZ
      const response = await fetch(`${serverUrl}/presets?id=${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Delete failed on server');
    } catch (e) {
      console.error("Cloud delete failed:", e);
      alert("⚠️ Cloud delete failed. Check network.");
      return; // Stop if cloud delete fails to prevent out-of-sync
    }
  }

  // Also delete local
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
   return savePreset('default', key, data);
};

export const loadPresetFromDB = async (key: string): Promise<any> => {
    // This function is largely deprecated by getUserPresets but kept for compatibility
    // It only checks local DB
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
