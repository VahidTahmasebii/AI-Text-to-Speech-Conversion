import { SavedAudio } from '../types/tts';
import { base64ToBlob } from '../utils/formatters';

const DB_NAME = 'PersianTTS_Vault_v1';
const DB_VERSION = 1;
const STORE_NAME = 'saved_audios';

let dbInstance: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
        store.createIndex('isFavorite', 'isFavorite', { unique: false });
        store.createIndex('voiceName', 'voiceName', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      console.error('IndexedDB open error:', (event.target as IDBOpenDBRequest).error);
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

/**
 * Save an audio file to IndexedDB for persistent offline access
 */
export async function saveAudioToVault(audio: SavedAudio): Promise<SavedAudio> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    // Make sure audioBlob exists for swift offline player streaming
    if (!audio.audioBlob && audio.base64Audio) {
      audio.audioBlob = base64ToBlob(audio.base64Audio, audio.mimeType || 'audio/wav');
    }

    const request = store.put(audio);
    request.onsuccess = () => resolve(audio);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get all saved audio files sorted by creation date descending
 */
export async function getAllSavedAudios(): Promise<SavedAudio[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const items: SavedAudio[] = request.result || [];
      // Re-hydrate blobs from base64 if not present
      items.forEach((item) => {
        if (!item.audioBlob && item.base64Audio) {
          try {
            item.audioBlob = base64ToBlob(item.base64Audio, item.mimeType || 'audio/wav');
          } catch (e) {
            console.error('Failed to create blob for item:', item.id, e);
          }
        }
      });
      // Sort newest first
      items.sort((a, b) => b.createdAt - a.createdAt);
      resolve(items);
    };

    request.onerror = () => reject(request.error);
  });
}

/**
 * Get single audio item by ID
 */
export async function getSavedAudioById(id: string): Promise<SavedAudio | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => {
      const item = request.result as SavedAudio | undefined;
      if (item && !item.audioBlob && item.base64Audio) {
        item.audioBlob = base64ToBlob(item.base64Audio, item.mimeType || 'audio/wav');
      }
      resolve(item || null);
    };

    request.onerror = () => reject(request.error);
  });
}

/**
 * Delete an audio from offline vault
 */
export async function deleteAudioFromVault(id: string): Promise<boolean> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Toggle favorite status
 */
export async function toggleAudioFavorite(id: string): Promise<boolean> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const getReq = store.get(id);

    getReq.onsuccess = () => {
      const item = getReq.result as SavedAudio | undefined;
      if (!item) {
        resolve(false);
        return;
      }
      item.isFavorite = !item.isFavorite;
      const putReq = store.put(item);
      putReq.onsuccess = () => resolve(item.isFavorite);
      putReq.onerror = () => reject(putReq.error);
    };

    getReq.onerror = () => reject(getReq.error);
  });
}

/**
 * Update audio metadata (e.g. title, tags)
 */
export async function updateAudioMetadata(
  id: string,
  updates: Partial<Pick<SavedAudio, 'title' | 'tags' | 'isFavorite'>>
): Promise<SavedAudio | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const getReq = store.get(id);

    getReq.onsuccess = () => {
      const item = getReq.result as SavedAudio | undefined;
      if (!item) {
        resolve(null);
        return;
      }
      Object.assign(item, updates);
      const putReq = store.put(item);
      putReq.onsuccess = () => resolve(item);
      putReq.onerror = () => reject(putReq.error);
    };

    getReq.onerror = () => reject(getReq.error);
  });
}

/**
 * Calculate total storage used in IndexedDB
 */
export async function getVaultStorageStats(): Promise<{ count: number; totalBytes: number }> {
  const items = await getAllSavedAudios();
  const totalBytes = items.reduce((acc, curr) => acc + (curr.fileSizeBytes || 0), 0);
  return {
    count: items.length,
    totalBytes,
  };
}

/**
 * Clear all audios from vault
 */
export async function clearEntireVault(): Promise<boolean> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.clear();
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Export all items to JSON string for backup download
 */
export async function exportVaultToJson(): Promise<string> {
  const items = await getAllSavedAudios();
  // Strip non-serializable blob objects before JSON.stringify
  const cleanItems = items.map(({ audioBlob, ...rest }) => rest);
  return JSON.stringify({
    version: '1.0',
    exportedAt: Date.now(),
    appName: 'Persian TTS Studio',
    items: cleanItems,
  });
}

/**
 * Import items from backup JSON
 */
export async function importVaultFromJson(jsonString: string): Promise<number> {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || !Array.isArray(parsed.items)) {
      throw new Error('قالب فایل پشتیبان نامعتبر است.');
    }

    let importedCount = 0;
    for (const item of parsed.items) {
      if (item.id && item.base64Audio && item.text) {
        await saveAudioToVault({
          ...item,
          createdAt: item.createdAt || Date.now(),
          isFavorite: Boolean(item.isFavorite),
          tags: Array.isArray(item.tags) ? item.tags : ['وارد شده'],
        });
        importedCount++;
      }
    }
    return importedCount;
  } catch (err) {
    console.error('Import error:', err);
    throw err;
  }
}
