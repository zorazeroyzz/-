
import { CommissionData, Preset } from '../types';

const DB_NAME = 'DohnaCommissionDB';
const STORE_NAME = 'presets';
const DB_VERSION = 2;

// --- Local IndexedDB Helper ---
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

// --- CRUD Operations (Local Only) ---

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

export const savePreset = async (userId: string, name: string, data: CommissionData): Promise<void> => {
  const preset: Preset = {
    id: `${userId}_${Date.now()}`,
    userId,
    name,
    createdAt: Date.now(),
    data
  };

  await saveLocal(preset);
};

export const getUserPresets = async (userId: string): Promise<Preset[]> => {
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
