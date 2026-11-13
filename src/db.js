import { defaultAvatar } from './avatars.js';
export const DB_NAME = 'reading-app';
export const DB_VERSION = 2;
let connection;
export function openDatabase(name = DB_NAME, version = DB_VERSION) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, version);
    request.onupgradeneeded = event => {
      const db = request.result;
      // Additive migrations only. Failed upgrades roll back the transaction.
      if (!db.objectStoreNames.contains('profiles')) db.createObjectStore('profiles', { keyPath: 'profileId' });
      if (!db.objectStoreNames.contains('appMeta')) db.createObjectStore('appMeta', { keyPath: 'key' });
      if (event.oldVersion < 2 && !db.objectStoreNames.contains('recovery')) db.createObjectStore('recovery', { keyPath: 'key' });
    };
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Close other Reading Room tabs, then reload to finish the update. Your data has been kept.'));
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => db.close();
      resolve(db);
    };
  });
}
export async function database() { return connection ||= openDatabase().catch(err => { connection = null; throw err; }); }
export async function readAll(store) {
  const db = await database();
  return new Promise((resolve, reject) => {
    const request = db.transaction(store).objectStore(store).getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
export async function writeRecords(records) {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([...new Set(records.map(r => r.store))], 'readwrite');
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error('Save interrupted. Please try again.'));
    try {
      for (const { store, value } of records) tx.objectStore(store).put(structuredClone(value));
    } catch (err) {
      tx.abort();
      reject(err);
    }
  });
}
export function saveProfile(profile) { return writeRecords([{ store: 'profiles', value: profile }]); }
export function saveLastProfile(profileId) { return writeRecords([{ store: 'appMeta', value: { key: 'lastProfile', value: profileId } }]); }
export const id = () => crypto.randomUUID();
export function newProfile(name, audience = 'adults') {
  return { profileId: id(), name, audience, avatar: defaultAvatar(audience), createdAt: new Date().toISOString(), preferences: { language: 'en', animation: 'system', level: 1, filters: {} }, readingProgress: [], activityAttempts: [], collections: [] };
}
export async function hashPin(pin, salt = id()) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits']);
  const hash = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations: 150000, hash: 'SHA-256' }, key, 256);
  return { salt, hash: Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, '0')).join(''), iterations: 150000 };
}
