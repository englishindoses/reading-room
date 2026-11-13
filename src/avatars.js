export const avatarChoices = [
  { id: 'character-1', name: 'Maya', description: 'Girl with natural hair puffs' },
  { id: 'character-2', name: 'Leo', description: 'Boy with round teal glasses' },
  { id: 'character-3', name: 'Robin', description: 'Child with ginger curls and freckles' },
  { id: 'character-4', name: 'Noor', description: 'Teen with a plum headscarf' },
  { id: 'character-5', name: 'Arun', description: 'Teen with wavy hair and a blue hoodie' },
  { id: 'character-6', name: 'Alex', description: 'Teen with curls, glasses and a honey cardigan' },
  { id: 'character-7', name: 'Imani', description: 'Woman with dark curls and a terracotta top' },
  { id: 'character-8', name: 'Kenji', description: 'Older man with silver hair and glasses' },
  { id: 'character-9', name: 'Rose', description: 'Older woman with silver hair and a warm scarf' }
];
export const legacyAvatarIds = ['leaf', 'sun', 'moon', 'flower'];
const legacyPortraits = { leaf: 'character-7', sun: 'character-1', moon: 'character-5', flower: 'character-9' };
export const resolveAvatarId = value => legacyPortraits[value] || (avatarChoices.some(a => a.id === value) ? value : 'character-7');
export const avatarImage = value => `./assets/avatars/${resolveAvatarId(value)}.webp`;
export const defaultAvatar = audience => ({ kids: 'character-1', teens: 'character-5', adults: 'character-7' })[audience] || 'character-7';
