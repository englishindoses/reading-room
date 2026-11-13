import { avatarChoices, legacyAvatarIds } from './avatars.js';
const validAvatarIds = new Set([...legacyAvatarIds, ...avatarChoices.map(a => a.id)]);
const arrays = ['readingProgress', 'activityAttempts', 'collections'];
const plain = value => value && typeof value === 'object' && !Array.isArray(value);
const text = (v, max = 200) => typeof v === 'string' && v.length > 0 && v.length <= max;
const unique = (items, key) => new Set(items.map(x => x[key])).size === items.length;
export function validateBackup(input) {
  if (!plain(input) || input.format !== 'reading-app-backup' || input.formatVersion !== 1) throw new Error('Unsupported backup format or version. Choose a Reading Room version 1 backup.');
  if (!Array.isArray(input.profiles) || !input.profiles.length || input.profiles.length > 100) throw new Error('The backup must contain between 1 and 100 profiles.');
  const encoded = JSON.stringify(input);
  if (encoded.length > 20_000_000 || /"(?:__proto__|constructor|prototype)"\s*:/.test(encoded)) throw new Error('This backup contains unsafe or oversized data.');
  for (const entry of input.profiles) {
    const p = entry?.profile;
    if (!plain(p) || !text(p.profileId) || !text(p.name, 80) || !['kids', 'teens', 'adults'].includes(p.audience) || !plain(entry.preferences)) throw new Error('A profile is invalid. No data has been changed.');
    if (p.avatar && !validAvatarIds.has(p.avatar) && !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(p.avatar)) throw new Error('Invalid avatar image.');
    if (p.pin && (!plain(p.pin) || !text(p.pin.salt) || !/^[a-f0-9]{64}$/.test(p.pin.hash))) throw new Error('Invalid PIN metadata.');
    if (!['en', 'pt-BR'].includes(entry.preferences.language) || !['system', 'book', 'flip', 'none'].includes(entry.preferences.animation) || !Number.isInteger(entry.preferences.level) || entry.preferences.level < 1 || entry.preferences.level > 99 || (entry.preferences.filters && !plain(entry.preferences.filters))) throw new Error('Invalid profile preferences.');
    for (const key of arrays) if (!Array.isArray(entry[key]) || entry[key].length > 50000 || entry[key].some(r => !plain(r) || r.profileId !== p.profileId)) throw new Error(`Invalid ${key} records.`);
    for (const r of entry.readingProgress) if (!text(r.bookId) || !text(r.pageId) || !['in-progress', 'finished'].includes(r.status)) throw new Error('Invalid reading progress.');
    for (const r of entry.activityAttempts) if (!text(r.attemptId) || !text(r.bookId) || !text(r.pageId) || !plain(r.answers) || Object.values(r.answers).some(v => typeof v !== 'string' || v.length > 500) || (r.score !== undefined && (!Number.isInteger(r.score) || r.score < 0 || !Number.isInteger(r.total) || r.score > r.total))) throw new Error('Invalid activity attempt.');
    for (const r of entry.collections) if (!text(r.collectionId) || !text(r.name, 80) || !Array.isArray(r.bookIds) || r.bookIds.some(b => !text(b)) || new Set(r.bookIds).size !== r.bookIds.length) throw new Error('Invalid collection.');
    if (!unique(entry.readingProgress, 'bookId') || !unique(entry.activityAttempts, 'attemptId') || !unique(entry.collections, 'collectionId')) throw new Error('Duplicate record identifiers.');
  }
  if (new Set(input.profiles.map(x => x.profile.profileId)).size !== input.profiles.length) throw new Error('Duplicate profile identifiers.');
  return structuredClone(input);
}
export function exportBackup(profiles) {
  return { format: 'reading-app-backup', formatVersion: 1, appVersion: '0.1.0', exportedAt: new Date().toISOString(), profiles: profiles.map(p => {
    const { preferences, readingProgress, activityAttempts, collections, ...profile } = structuredClone(p);
    return { profile, preferences, readingProgress, activityAttempts, collections };
  }) };
}
export const flattenProfile = e => ({ ...e.profile, preferences: e.preferences, readingProgress: e.readingProgress, activityAttempts: e.activityAttempts, collections: e.collections });
export function importAsNew(entry, uuid = () => crypto.randomUUID()) {
  const p = flattenProfile(structuredClone(entry));
  p.profileId = uuid();
  p.name = `${p.name.slice(0, 70)} (copy)`;
  const runs = new Map();
  for (const key of arrays) for (const r of p[key]) {
    r.profileId = p.profileId;
    if (r.attemptId) r.attemptId = uuid();
    if (r.collectionId) r.collectionId = uuid();
    if (r.runId) { if (!runs.has(r.runId)) runs.set(r.runId, uuid()); r.runId = runs.get(r.runId); }
  }
  return p;
}
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
export function mergeProfiles(local, incoming, resolutions = {}) {
  const result = structuredClone(local);
  const conflicts = [];
  function choose(key, a, b, description) {
    if (equal(a, b)) return a;
    if (!resolutions[key]) conflicts.push({ key, description, local: a, incoming: b });
    return resolutions[key] === 'incoming' ? b : a;
  }
  const metadata = p => Object.fromEntries(Object.entries(p).filter(([k]) => !arrays.includes(k)));
  Object.assign(result, choose('profile', metadata(local), metadata(incoming), 'Profile details and preferences'));
  for (const [group, identity] of [['readingProgress', 'bookId'], ['activityAttempts', 'attemptId'], ['collections', 'collectionId']]) {
    const merged = new Map(local[group].map(r => [r[identity], structuredClone(r)]));
    for (const record of incoming[group]) {
      const key = record[identity];
      // Same collection name with different IDs needs explicit review too.
      const sameName = group === 'collections' && !merged.has(key) ? [...merged.values()].find(r => r.name === record.name) : null;
      if (sameName) {
        const chosen = choose(`${group}:name:${record.name}`, sameName, record, `Collection “${record.name}” has different contents`);
        merged.delete(sameName.collectionId); merged.set(chosen.collectionId, chosen);
      } else merged.set(key, merged.has(key) ? choose(`${group}:${key}`, merged.get(key), record, `${group}: ${record.name || record.bookId}`) : record);
    }
    result[group] = [...merged.values()];
  }
  return { profile: result, conflicts };
}
