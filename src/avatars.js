export const avatarChoices = [
  { id: 'pocket-dragon', name: 'Pocket Dragon', audience: 'kids' },
  { id: 'cloud-sheep', name: 'Cloud Sheep', audience: 'kids' },
  { id: 'mushroom-sprite', name: 'Mushroom Sprite', audience: 'kids' },
  { id: 'moon-moth', name: 'Moon Moth', audience: 'teens' },
  { id: 'space-fox', name: 'Space Fox', audience: 'teens' },
  { id: 'cassette-robot', name: 'Cassette Robot', audience: 'teens' },
  { id: 'mapmaker-owl', name: 'Mapmaker Owl', audience: 'adults' },
  { id: 'moss-golem', name: 'Moss Golem', audience: 'adults' },
  { id: 'pearl-nautilus', name: 'Pearl Nautilus', audience: 'adults' }
];

const legacyPortraits = { leaf: 'character-7', sun: 'character-1', moon: 'character-5', flower: 'character-9' };
const oldPortraitIds = Array.from({ length: 9 }, (_, index) => 'character-' + (index + 1));
export const legacyAvatarIds = [...Object.keys(legacyPortraits), ...oldPortraitIds];

export const defaultAvatar = audience => ({ kids: 'pocket-dragon', teens: 'moon-moth', adults: 'mapmaker-owl' })[audience] || 'mapmaker-owl';
export function resolveAvatarId(value) {
  if (Object.hasOwn(legacyPortraits, value)) return legacyPortraits[value];
  if (oldPortraitIds.includes(value) || avatarChoices.some(avatar => avatar.id === value)) return value;
  return defaultAvatar('adults');
}
export const avatarImage = value => `./assets/avatars/${resolveAvatarId(value)}.webp`;
