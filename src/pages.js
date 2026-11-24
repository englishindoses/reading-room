import { t } from './i18n.js';
import { icon } from './icons.js';
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]);
const mediaUrl = value => {
  if (!value) return '';
  const url = new URL(value, location.href);
  return url.origin === location.origin && ['https:','http:'].includes(url.protocol) ? escape(url.href) : '';
};
function textPage(page) {
  const image = mediaUrl(page.image);
  const audio = mediaUrl(page.audio);
  const figure = image ? `<figure class="page-image"><img src="${image}" alt="${escape(page.alt || '')}">${page.caption ? `<figcaption>${escape(page.caption)}</figcaption>` : ''}</figure>` : '';
  const narration = page.type === 'story' && audio ? storyAudio(page, audio) : '';
  const copy = page.text ? `<div class="page-copy"><p class="story-text">${escape(page.text)}</p>${narration}</div>` : narration;
  const heading = page.type === 'story' && /^Page \d+$/i.test(page.title) ? '' :
    `<div class="reader-rule" aria-hidden="true"></div><h1>${escape(page.title)}</h1>`;
  return `${heading}<div class="page-layout ${['image-beside-text','image-below-text'].includes(page.layout) ? page.layout : 'image-above-text'}">${page.layout === 'image-below-text' ? copy+figure : figure+copy}</div>${audio && !narration ? `<div class="page-audio"><audio controls preload="metadata" src="${audio}" aria-label="${escape(page.audioLabel || page.title)}">${t('Audio playback is unavailable in this browser.')}</audio>${page.transcript ? `<details><summary>${t('Audio transcript')}</summary><p class="story-text">${escape(page.transcript)}</p></details>` : ''}</div>` : ''}${page.note ? `<p class="small muted divider">${escape(page.note)}</p>` : ''}`;
}
function storyAudio(page, audio) {
  const play = (label, src) => `<button class="secondary" data-action="play-narration" data-audio="${src}">${icon('volume')}${label}</button>`;
  const words = (page.wordAudio || []).map(word => {
    const src = mediaUrl(word.audio);
    return src ? play(escape(word.label), src) : '';
  }).join('');
  return `<div class="story-audio">${play(t('Hear sentence'), audio)}${words ? `<details><summary>${t('Hear words')}</summary><div class="story-word-audio">${words}</div></details>` : ''}<audio id="reader-audio" preload="none"></audio></div>`;
}
// New page layouts/types are registered here without changing book navigation.
export const pageRenderers = { story: textPage, intro: textPage, image: textPage, audio: textPage, mixed: textPage };
export function renderContentPage(page) {
  return pageRenderers[page.type]?.(page) || `<h1>${escape(page.title)}</h1><p>${t('This page needs a newer app version. Your progress has been kept.')}</p>`;
}
