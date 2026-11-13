import { t } from './i18n.js';
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
  const copy = page.text ? `<p class="story-text">${escape(page.text)}</p>` : '';
  return `<div class="reader-rule" aria-hidden="true"></div><h1>${escape(page.title)}</h1><div class="page-layout ${['image-beside-text','image-below-text'].includes(page.layout) ? page.layout : 'image-above-text'}">${page.layout === 'image-below-text' ? copy+figure : figure+copy}</div>${audio ? `<div class="page-audio"><audio controls preload="metadata" src="${audio}" aria-label="${escape(page.audioLabel || page.title)}">${t('Audio playback is unavailable in this browser.')}</audio>${page.transcript ? `<details><summary>${t('Audio transcript')}</summary><p class="story-text">${escape(page.transcript)}</p></details>` : ''}</div>` : ''}${page.note ? `<p class="small muted divider">${escape(page.note)}</p>` : ''}`;
}
// New page layouts/types are registered here without changing book navigation.
export const pageRenderers = { story: textPage, intro: textPage, image: textPage, audio: textPage, mixed: textPage };
export function renderContentPage(page) {
  return pageRenderers[page.type]?.(page) || `<h1>${escape(page.title)}</h1><p>${t('This page needs a newer app version. Your progress has been kept.')}</p>`;
}
