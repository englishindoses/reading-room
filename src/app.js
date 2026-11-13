import { readAll, saveProfile, saveLastProfile, newProfile, id, hashPin, writeRecords } from './db.js';
import { exportBackup, validateBackup, flattenProfile, mergeProfiles, importAsNew } from './backup.js';
import { loadCatalogue, checkAnswer, activityTypes } from './content.js';
import { icon } from './icons.js';
import { t, setLocale } from './i18n.js';
import { renderContentPage } from './pages.js';

const $ = (q, root = document) => root.querySelector(q);
const $$ = (q, root = document) => [...root.querySelectorAll(q)];
export const escapeHtml = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]);
const e = escapeHtml;
const state = { profiles: [], books: [], profile: null, route: 'library', bookId: null, page: 0, navOpen: false, offlineReady: false, offlineError: false, collectionId: null, detailOrigin: 'library', finished: false, resumePrompt: false, checking: false };
let saveQueue = Promise.resolve();
let pendingSaves = 0;
let toastTimer;
let installPrompt;
let waitingWorker;
let backupPreview;
const main = $('#main');
const dialog = $('#dialog');
const avatar = (p, large = false) => `<span class="avatar${large ? ' large' : ''}">${p?.avatar?.startsWith('data:image/') ? `<img src="${e(p.avatar)}" alt="">` : icon(p?.avatar || 'leaf')}</span>`;
const button = (label, action, cls = 'secondary', extra = '') => `<button class="${cls}" data-action="${action}" ${extra}>${t(label)}</button>`;
const statusLabel = value => t({ 'in-progress': 'In progress', finished: 'Finished' }[value] || 'Not started');
const profile = () => state.profile;
const book = () => state.books.find(b => b.id === state.bookId);
const progress = b => profile()?.readingProgress.find(p => p.bookId === b.id);
const currentPage = () => book().pages[state.page];
const field = (label, input) => `<label>${t(label)}${input}</label>`;
const option = (value, label, selected) => `<option value="${e(value)}" ${String(selected) === String(value) ? 'selected' : ''}>${e(t(label))}</option>`;
const errorText = err => err instanceof Error ? err.message : String(err);

function toast(message) { clearTimeout(toastTimer); $('#toast').textContent = t(message); toastTimer = setTimeout(() => { $('#toast').textContent = ''; }, 4500); }
function report(err) { console.error(err); toast(errorText(err)); }
function persist() {
  const snapshot = structuredClone(profile());
  pendingSaves++;
  saveIndicator();
  const operation = saveQueue.catch(() => {}).then(() => saveProfile(snapshot));
  saveQueue = operation;
  operation.then(() => { pendingSaves--; saveIndicator(); }, err => { pendingSaves--; state.saveError = true; saveIndicator(); report(new Error(`Your last change could not be saved. ${errorText(err)} Export a backup before closing.`)); });
  return operation;
}
function saveIndicator() {
  const el = $('#save-state');
  if (el) el.innerHTML = `${icon(pendingSaves ? 'cloud' : 'check')}${e(state.saveError ? 'Save failed. Export a backup before closing.' : t(pendingSaves ? 'Saving…' : 'Saved on this device'))}`;
}
async function selectProfile(p, unlocked = false) {
  if (p.pin && !unlocked) { pinDialog(p); return; }
  await saveQueue.catch(() => {});
  state.profile = p; state.saveError = false;
  setLocale(p.preferences.language);
  await saveLastProfile(p.profileId);
  go('library');
}
function go(route, extra = {}) {
  state.route = route; Object.assign(state, extra);
  state.navOpen = false;
  history.pushState({ route }, '', `#${route}`);
  render(); window.scrollTo(0, 0); main.focus({ preventScroll: true });
}
function backButton(action = 'library') { return `<button class="back" data-action="${action}">${icon('back')}${t('Back')}</button>`; }
function renderHeader() {
  $('#header').innerHTML = `<button class="brand" data-action="library" aria-label="${t('Reading Room')} — ${t('Library')}"><span class="brand-mark">${icon('book')}</span>${t('Reading Room')}</button><div class="header-tools"><span class="offline-status" title="${t(state.offlineReady ? 'Ready offline' : state.offlineError ? 'Offline download incomplete' : 'Downloading for offline use…')}">${icon(state.offlineReady ? 'check' : 'cloud')}<span>${t(state.offlineReady ? 'Ready offline' : state.offlineError ? 'Offline download incomplete' : 'Downloading for offline use…')}</span></span>${installPrompt ? `<button class="small secondary install-button" data-action="install" aria-label="${t('Install app')}">${icon('download')}<span>${t('Install app')}</span></button>` : ''}${profile() ? `<button class="icon-button" data-action="profile" aria-label="${t('My Profile')}">${avatar(profile())}</button>` : ''}</div>`;
}
function renderNav() {
  const nav = $('#nav');
  if (!profile() || ['create', 'profiles'].includes(state.route)) { nav.hidden = true; return; }
  nav.hidden = false;
  const reading = state.route === 'reader';
  nav.className = reading ? `reader-nav ${state.navOpen ? '' : 'collapsed'}` : '';
  const active = ['stats','settings','edit','data','reset','profile'].includes(state.route) ? 'profile' : state.route === 'collection' ? 'collections' : 'library';
  nav.innerHTML = `${reading ? `<p class="save-state" id="save-state"></p><button class="nav-handle" data-action="toggle-nav" aria-expanded="${state.navOpen}">${icon(state.navOpen ? 'down' : 'up')}${t(state.navOpen ? 'Hide navigation' : 'Open navigation')}</button><div class="page-index" aria-label="${t('Pages')}">${book().pages.map((p, i) => `<button class="${state.page === i ? 'active' : ''} ${p.type === 'activity' ? 'activity-page' : ''}" data-action="page" data-index="${i}" aria-label="${t('Page')} ${i+1}: ${e(p.title)}" ${state.page === i ? 'aria-current="page"' : ''}>${i+1}</button>`).join('')}</div>` : ''}<div class="nav-links">${[['library','book','Library'],['collections','collection','My Collections'],['profile',null,'My Profile']].map(([route, ic, label]) => `<button data-action="${route}" class="${!reading && active === route ? 'active' : ''}" ${!reading && active === route ? 'aria-current="page"' : ''}>${ic ? icon(ic) : avatar(profile())}<span>${t(label)}</span></button>`).join('')}</div>`;
  if (reading) saveIndicator();
}
function render() {
  setLocale(profile()?.preferences.language || 'en');
  document.body.dataset.theme = profile()?.audience || 'adults';
  renderHeader();
  const views = { create: profileForm, library: libraryView, details: detailView, reader: readerView, collections: collectionsView, collection: collectionView, profile: profileView, profiles: profilesView, stats: statsView, settings: settingsView, edit: () => profileForm(true), data: dataView, reset: resetView };
  main.innerHTML = (views[state.route] || libraryView)();
  renderNav();
  saveIndicator();
  document.title = `${state.route === 'reader' ? book().title : t({ library:'Library', collections:'My Collections', profile:'My Profile', stats:'Your progress', settings:'Settings' }[state.route] || 'Reading Room')} · Reading Room`;
}

function profileForm(edit = false) {
  const p = edit ? profile() : null;
  return `<div class="form-panel">${edit ? backButton('settings') : state.profiles.length ? backButton('profiles') : ''}<div class="welcome">${!edit ? `<span class="brand-mark">${icon('book')}</span>` : ''}<h1 class="serif">${t(edit ? 'Edit profile' : 'A little reading. A world to discover.')}</h1><p class="muted">${t(edit ? 'Your profile stays on this device. No account needed.' : 'Your reading journey starts here.')}</p></div><form id="profile-form" class="stack" data-edit="${edit}">
    ${field('Your name', `<input name="name" required maxlength="80" autocomplete="given-name" value="${e(p?.name || '')}">`)}
    <fieldset class="avatar-field" style="border:0;padding:0;margin:0"><legend class="small" style="font-weight:600;margin-bottom:10px">${t('Choose an avatar')}</legend><div class="avatar-options">${['leaf','sun','moon','flower'].map(v => `<label class="avatar-choice"><input type="radio" name="avatar" value="${v}" ${(!p || p.avatar === v || (p.avatar?.startsWith('data:') && v === 'leaf')) && v === (p?.avatar?.startsWith('data:') ? 'leaf' : p?.avatar || 'leaf') ? 'checked' : ''} aria-label="${v}"><span class="avatar">${icon(v)}</span></label>`).join('')}</div></fieldset>
    ${p?.avatar?.startsWith('data:') ? `<div class="row">${avatar(p)}<span class="small muted">${t('Upload photo')}</span></div>` : ''}
    ${field('Upload photo', '<input name="photo" type="file" accept="image/png,image/jpeg,image/webp">')}
    ${field('Audience', `<select name="audience">${[['kids','Kids'],['teens','Teens'],['adults','Adults']].map(([v,l])=>option(v,l,p?.audience || 'adults')).join('')}</select>`)}
    ${field('Reading level', `<input name="level" type="number" min="1" max="99" value="${p?.preferences.level || 1}" required>`)}
    ${edit && p.pin ? field('Current PIN', '<input type="password" name="currentPin" autocomplete="current-password">') : ''}
    ${field(edit ? 'New PIN (optional)' : 'Optional PIN', `<input type="password" name="pin" minlength="4" maxlength="64" autocomplete="new-password" ${edit ? '' : `placeholder="${t('Leave blank for no PIN.')}"`}>`)}
    ${edit && p.pin ? `<label class="check-label"><input type="checkbox" name="removePin">${t('Remove PIN')}</label>` : ''}
    <p id="form-error" class="form-error" role="alert" hidden></p><button class="primary" type="submit">${t(edit ? 'Save' : 'Create profile')}${icon('arrow')}</button>
    ${!edit ? `<p class="small muted">${t('Your profile stays on this device. No account needed.')}</p>` : ''}
  </form></div>`;
}
function bookCard(b) {
  const p = progress(b);
  return `<article class="book-card"><button class="cover-button" data-action="details" data-id="${b.id}" aria-label="${t('View book')}: ${e(b.title)}"><img class="cover" src="${e(b.cover)}" alt="${e(b.title)} — ${t('Sample book')}" width="480" height="640"></button><div class="book-info"><span class="book-meta">${t('Level')} ${b.readingLevel} <span aria-hidden="true">·</span> ${b.minutes} ${t('minutes')}</span><h3><button class="book-title" data-action="details" data-id="${b.id}">${e(b.title)}</button></h3><div class="row between"><span class="badge">${p ? statusLabel(p.status) : t('Sample book')}</span><button class="add" data-action="add-collection" data-id="${b.id}" aria-label="${t('Add to collection')}: ${e(b.title)}">${icon('plus')}${t('Add to collection')}</button></div></div></article>`;
}
function filteredBooks() {
  const f = profile().preferences.filters;
  return state.books.filter(b => {
    const level = f.level ?? String(profile().preferences.level);
    return (!f.search || b.title.toLocaleLowerCase().includes(f.search.toLocaleLowerCase())) && (f.audience === 'all' || b.audiences.includes(f.audience || profile().audience)) && (level === 'all' || level === 'range' ? level !== 'range' || b.readingLevel >= Number(f.min || 1) && b.readingLevel <= Number(f.max || 99) : b.readingLevel === Number(level)) && (!f.status || (progress(b)?.status || 'not-started') === f.status) && (!f.category || b.categories.includes(f.category)) && (!f.series || b.seriesId === f.series);
  }).sort((a,b) => {
    switch (f.sort) {
      case 'level-up': return a.readingLevel-b.readingLevel;
      case 'level-down': return b.readingLevel-a.readingLevel;
      case 'recent': return (progress(b)?.updatedAt || '').localeCompare(progress(a)?.updatedAt || '');
      case 'status': return (progress(a)?.status || 'not-started').localeCompare(progress(b)?.status || 'not-started');
      default: return a.title.localeCompare(b.title);
    }
  });
}
function libraryView() {
  const p = profile();
  const f = p.preferences.filters;
  const reading = [...p.readingProgress].filter(r => r.status === 'in-progress').sort((a,b)=>(b.updatedAt || '').localeCompare(a.updatedAt || ''));
  const continued = reading.map(r => state.books.find(b => b.id === r.bookId)).find(Boolean);
  const levels = [...new Set(state.books.map(b => b.readingLevel))];
  const books = filteredBooks();
  return `<section class="intro"><h1 class="serif">${t('A little reading. A world to discover.')}</h1><p class="muted">${t('Short stories, at your own pace.')}</p><p class="greeting">${t('Welcome back')}, ${e(p.name)}.</p></section><div class="library-content"><div class="library-main">${continued ? `<section class="continue-section"><img src="${e(continued.cover)}" alt="" width="72" height="96"><div><p class="small muted">${t('Continue reading')}</p><h3>${e(continued.title)}</h3><button data-action="details" data-id="${continued.id}">${t('Continue')}${icon('arrow')}</button></div></section>` : ''}<div class="section-heading"><h2>${t('Browse books')}</h2><span class="book-count" id="book-count">${books.length} ${t('books')}</span></div><div class="search">${icon('search')}<input id="search" type="search" placeholder="${t('Search by title…')}" aria-label="${t('Search books')}" value="${e(f.search || '')}"></div><details class="filter-panel" ${state.filtersOpen ? 'open' : ''}><summary>${icon('settings')} ${t('Filters')}</summary><div class="filter-grid">${field('Audience', `<select data-filter="audience">${option('all','All audiences',f.audience || p.audience)}${[['kids','Kids'],['teens','Teens'],['adults','Adults']].map(([v,l])=>option(v,l,f.audience || p.audience)).join('')}</select>`)}${field('Reading level', `<select data-filter="level">${option('all','All levels',f.level ?? p.preferences.level)}${levels.map(l=>option(l,`${t('Level')} ${l}`,f.level ?? p.preferences.level)).join('')}${option('range','Level range',f.level)}</select>`)}${field('Status', `<select data-filter="status">${option('','All statuses',f.status)}${[['not-started','Not started'],['in-progress','In progress'],['finished','Finished']].map(([v,l])=>option(v,l,f.status)).join('')}</select>`)}${field('Category', `<select data-filter="category">${option('','All categories',f.category)}${[...new Set(state.books.flatMap(b=>b.categories))].map(c=>option(c,c,f.category)).join('')}</select>`)}${field('Series', `<select data-filter="series">${option('','All series',f.series)}${[...new Set(state.books.map(b=>b.seriesId))].map(c=>option(c,c,f.series)).join('')}</select>`)}${field('Sort by', `<select data-filter="sort">${[['title','Title A–Z'],['level-up','Level ascending'],['level-down','Level descending'],['recent','Recently opened'],['status','Status']].map(([v,l])=>option(v,l,f.sort)).join('')}</select>`)}${f.level === 'range' ? `${field('Minimum level', `<input data-filter="min" type="number" min="1" max="99" value="${e(f.min || 1)}">`)}${field('Maximum level', `<input data-filter="max" type="number" min="1" max="99" value="${e(f.max || 99)}">`)}` : ''}</div></details><div class="book-grid" id="books">${books.map(bookCard).join('')}</div><div id="no-books" ${books.length ? 'hidden' : ''} class="empty"><h3>${t('No books match these filters.')}</h3>${button('Clear filters','clear-filters')}</div><div class="sample-note">${icon('book')}<p><strong>${t('Sample library')}</strong><br>${t('Two sample books to try. More stories can be added with future updates.')}</p></div></div><aside class="library-aside"><h2>${t('Choose a story. Take your time. Make it yours.')}</h2><p>${t('Sample content for trying the app; not a commissioned reading programme.')}</p><div class="divider"><p>${t('Saved on this device')}</p><p>${t('Your profile stays on this device. No account needed.')}</p><button class="text-button small" data-action="stats">${t('Check your stats')}${icon('arrow')}</button></div></aside></div>`;
}
function detailView() {
  const b = book(), p = progress(b);
  return `${backButton('detail-back')}<section class="book-detail"><img class="cover detail-cover" src="${e(b.cover)}" alt="${e(b.title)}" width="480" height="640"><div class="detail-copy"><span class="badge">${t('Sample book')}</span><h1 class="serif">${e(b.title)}</h1><p class="muted">${e(b.subtitle)}</p><div class="detail-facts"><span>${t('Level')} ${b.readingLevel}</span><span>${b.minutes} ${t('minutes')}</span><span>${b.pages.length} ${t('Pages').toLocaleLowerCase()}</span></div><p class="description">${e(b.description)}</p><p class="small muted">${e(b.categories.join(' · '))} · ${e(b.seriesId)}</p><p><span class="badge">${statusLabel(p?.status)}</span></p><div class="actions">${button(p?.status === 'finished' ? 'Read again' : p ? 'Continue' : 'Start reading', p?.status === 'finished' ? 'restart' : 'start', 'primary')}${p && p.status !== 'finished' ? button('Start again','restart') : ''}${p?.status === 'finished' ? button('View results','stats') : ''}</div><button class="text-button" data-action="add-collection" data-id="${b.id}">${icon('plus')}${t('Add to collection')}</button><p class="small muted divider">${t('Sample content for trying the app; not a commissioned reading programme.')}</p></div></section>`;
}
function getAttempt(create = true) {
  const b = book(), page = currentPage(), run = progress(b)?.runId;
  let a = [...profile().activityAttempts].reverse().find(a=>a.bookId === b.id && a.pageId === page.id && a.runId === run && !a.archived);
  if (!a && create) { a = { attemptId:id(), profileId:profile().profileId, bookId:b.id, pageId:page.id, runId:run, answers:{}, checked:false, revealed:false, createdAt:new Date().toISOString() }; profile().activityAttempts.push(a); }
  return a;
}
function activityView(page) {
  if (!activityTypes.has(page.activityType)) return '<p>This activity is not available in this version. Your progress has been kept.</p>';
  const a = getAttempt();
  if (state.resumePrompt && Object.keys(a.answers).length && !a.checked) return `<h1>${e(page.title)}</h1><div class="notice"><p>${t('Your saved answers are ready.')}</p><div class="actions">${button('Continue your answers','resume-answers','primary')}${button('Start again','retry')}</div></div>`;
  return `<h1>${e(page.title)}</h1><p class="muted">${e(page.instructions)}</p>${page.activityType === 'drag-drop' ? `<div class="drag-bank">${page.questions[0].options.map((word,i)=>`<div class="drag-word" draggable="true" data-word="${e(word)}">${e(word)}</div>`).join('')}</div>` : ''}${page.questions.map((q,i)=>{
    const value = a.answers[q.id];
    const correct = checkAnswer(q,value);
    let input;
    if (['multiple-choice','true-false'].includes(page.activityType)) input = q.options.map((v,j)=>`<label class="answer-option"><input type="radio" name="answer-${q.id}" data-answer="${q.id}" value="${e(v)}" ${value === v ? 'checked' : ''}>${e(v)}</label>`).join('');
    else if (page.activityType === 'typed-gap') input = `<input type="text" data-answer="${q.id}" value="${e(value || '')}" aria-label="${t('Your answer')}: ${e(q.prompt)}" autocomplete="off" spellcheck="false" maxlength="500">`;
    else input = `<select data-answer="${q.id}" aria-label="${e(q.prompt)}">${option('','Choose an answer',value)}${q.options.map(v=>option(v,v,value)).join('')}</select>`;
    return `<fieldset class="question" data-drop="${q.id}"><legend>${e(q.prompt)}</legend>${input}${a.checked || a.revealed ? `<p class="feedback ${!correct && !a.revealed ? 'incorrect' : ''}" role="status">${a.revealed ? `${t('Answer revealed:')} ${e(q.answer)}` : correct ? t('Correct. Well done!') : `${t('Not quite. Try this clue:')} ${e(q.hint)}`}</p>` : ''}</fieldset>`;
  }).join('')}<div class="activity-actions">${button(a.checked ? 'Check again' : 'Check answers','check','primary')}${button('Retry','retry')}${button('See correct answers','reveal','reveal text-button')}</div>`;
}
function readerView() {
  const b = book();
  if (state.finished) return `<section class="reader"><div class="reader-paper finished-page"><span class="large-check">${icon('check')}</span><h1>${t('Book finished')}</h1><p>${e(b.title)}</p><p class="muted">${t('A little further, one page at a time.')}</p><div class="actions">${button('View results','stats','primary')}${button('Back to library','library')}</div></div></section>`;
  const page = currentPage();
  let mode = profile().preferences.animation;
  if (mode === 'system') mode = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'none' : 'flip';
  return `<section class="reader"><div class="reader-top">${backButton('reader-back')}<span class="reader-title">${e(b.title)}</span><span class="reader-page-count">${state.page+1} ${t('of')} ${b.pages.length}</span></div><article class="reader-paper ${page.type} ${state.animatePage ? `animate-${mode}` : ''}">${page.type === 'activity' ? activityView(page) : renderContentPage(page)}</article><div class="reader-controls"><button class="secondary" data-action="previous" ${state.page === 0 ? 'disabled' : ''}>${icon('back')}${t('Previous')}</button><button class="primary" data-action="next">${t(state.page === b.pages.length-1 ? 'Finish book' : 'Next')}${icon('arrow')}</button></div></section>`;
}
function collectionsView() {
  return `<div class="narrow"><div class="section-heading page-title"><h1>${t('My Collections')}</h1>${button('New collection','new-collection','primary small')}</div>${profile().collections.length ? `<div class="shelf-list">${profile().collections.map(c=>`<button class="shelf-row" data-action="collection" data-id="${c.collectionId}"><span class="row"><span class="shelf-icon">${icon('collection')}</span><span><strong>${e(c.name)}</strong><br><span class="small muted">${c.bookIds.length} ${t('books')}</span></span></span>${icon('arrow')}</button>`).join('')}</div>` : `<section class="empty"><h2 class="serif">${t('A shelf of your own.')}</h2><p>${t('Keep the stories you want to come back to together.')}</p></section>`}</div>`;
}
const collection = () => profile().collections.find(c=>c.collectionId === state.collectionId);
function collectionView() {
  const c = collection();
  if (!c) return collectionsView();
  return `<div class="narrow">${backButton('collections')}<h1>${e(c.name)}</h1><div class="row">${button('Rename','rename-collection','small secondary')}${button('Delete collection','delete-collection','small danger')}</div><div class="divider">${c.bookIds.length ? c.bookIds.map((bid,i)=>{const b = state.books.find(b=>b.id===bid); return `<div class="collection-book">${b ? `<button class="cover-button" style="width:54px" data-action="details" data-id="${b.id}"><img src="${e(b.cover)}" alt="${e(b.title)}"></button>` : ''}<div class="grow"><button class="book-title" data-action="${b ? 'details' : 'unavailable'}" data-id="${bid}">${e(b?.title || 'Unavailable book')}</button><span class="small muted">${b ? `${t('Level')} ${b.readingLevel}` : 'Your progress is retained.'}</span></div><div class="controls"><button class="icon-button" data-action="move-up" data-index="${i}" aria-label="${t('Move up')}" ${i===0?'disabled':''}>${icon('up')}</button><button class="icon-button" data-action="move-down" data-index="${i}" aria-label="${t('Move down')}" ${i===c.bookIds.length-1?'disabled':''}>${icon('down')}</button><button class="icon-button" data-action="remove-book" data-id="${bid}" aria-label="${t('Remove')}: ${e(b?.title || bid)}">${icon('close')}</button></div></div>`;}).join('') : `<div class="empty"><h2>${t('No books here yet.')}</h2><p>${t('Browse the library and add a book to this collection.')}</p>${button('Browse books','library','primary')}</div>`}</div></div>`;
}
function profileView() {
  const p = profile();
  return `<div class="narrow"><div class="profile-heading">${avatar(p,true)}<div><h1>${e(p.name)}</h1><p class="muted">${t({kids:'Kids',teens:'Teens',adults:'Adults'}[p.audience])} · ${t('Level')} ${p.preferences.level}</p></div></div>${[['stats','stats','Stats'],['settings','settings','Settings'],['profiles','switch','Switch profile']].map(([action,ic,label])=>`<button class="menu-row" data-action="${action}"><span>${icon(ic)}${t(label)}</span>${icon('arrow')}</button>`).join('')}</div>`;
}
function profilesView() {
  return `<div class="narrow"><h1>${t('Switch profile')}</h1><p class="muted">${t('Your profile stays on this device. No account needed.')}</p><div class="profile-grid">${state.profiles.map(p=>`<button class="profile-option" data-action="select-profile" data-id="${p.profileId}"><span>${avatar(p)}<span>${e(p.name)}<br><span class="small muted">${t({kids:'Kids',teens:'Teens',adults:'Adults'}[p.audience])}</span></span></span>${icon('arrow')}</button>`).join('')}</div><div class="actions">${button('New profile','create','primary')}</div></div>`;
}
function stats() { const p = profile(); return { finished:p.readingProgress.filter(r=>r.status === 'finished' || r.completedAt).length, reading:p.readingProgress.filter(r=>r.status === 'in-progress').length, activities:p.activityAttempts.filter(a=>a.checked).length }; }
function summary(name = '') { const s = stats(); return `${name ? `${name}: ` : ''}${t('Books finished')}: ${s.finished}. ${t('Books in progress')}: ${s.reading}. ${t('Activities checked')}: ${s.activities}.`; }
function statsView() {
  const s = stats();
  return `<div class="narrow">${backButton('profile')}<h1>${t('Your progress')}</h1><div class="stats-strip">${[['finished','Books finished'],['reading','Books in progress'],['activities','Activities checked']].map(([k,l])=>`<div class="stat"><strong>${s[k]}</strong><span>${t(l)}</span></div>`).join('')}</div><h2>${t('Activity results')}</h2>${profile().activityAttempts.filter(a=>a.checked).slice().reverse().map(a=>{ const b = state.books.find(b=>b.id === a.bookId); const page = b?.pages.find(p=>p.id===a.pageId); return `<div class="result-row"><div><p>${e(b?.title || 'Unavailable book')}</p><p class="small muted">${e(page?.title || a.pageId)} · ${new Date(a.updatedAt || a.createdAt).toLocaleDateString()}</p></div><span class="score">${a.score ?? 0}/${a.total ?? 0}${a.revealed ? `<br><span class="small muted">${t('Revealed')}</span>` : ''}</span></div>`; }).join('') || `<p class="muted">${t('No results yet. Read a story and try an activity.')}</p>`}<div class="divider">${field('Name in shared summary (optional)', '<input id="share-name" maxlength="80" value="">')}<div class="actions">${button('Share progress','share','primary')}${button('Copy summary','copy-summary')}${button('Download summary','download-summary')}</div></div></div>`;
}
function settingsView() {
  const p = profile();
  return `<div class="narrow">${backButton('profile')}<h1>${t('Settings')}</h1><section class="settings-group"><h2>${t('Reading')}</h2>${field('Page turning', `<select id="animation">${[['system','Follow device preference'],['book','Book-style'],['flip','Simple flip'],['none','None']].map(([v,l])=>option(v,l,p.preferences.animation)).join('')}</select>`)}</section><section class="settings-group"><h2>${t('Appearance & language')}</h2>${field('Interface language', `<select id="language">${option('en','English',p.preferences.language)}${option('pt-BR','Português do Brasil',p.preferences.language)}</select>`)}<p class="small muted">${t('Story text and activities stay in their original language.')}</p></section>${[['edit','leaf','Edit profile'],['data','download','Data & backup'],['reset','settings','Reset progress']].map(([action,ic,l])=>`<button class="menu-row" data-action="${action}"><span>${icon(ic)}${t(l)}</span>${icon('arrow')}</button>`).join('')}<p class="small muted divider">Reading Room · 0.1.0<br>${t('Your profile stays on this device. No account needed.')}</p></div>`;
}
function dataView() {
  return `<div class="narrow">${backButton('settings')}<h1>${t('Data & backup')}</h1><p class="muted">${t('Your reading data lives on this device. Export a backup to keep a portable copy. Browser data can be removed or lost.')}</p><section class="settings-group"><h2>${t('Export backup')}</h2><div id="export-profiles">${state.profiles.map(p=>`<label class="check-label"><input type="checkbox" data-export="${p.profileId}" ${p.profileId===profile().profileId?'checked':''}>${e(p.name)}</label>`).join('')}</div><div class="actions">${button('Export selected profiles','export','primary')}</div></section><section class="settings-group"><h2>${t('Import backup')}</h2><label>${t('Import backup')}<input type="file" id="import-file" accept=".json,application/json"></label><div id="import-preview"></div></section></div>`;
}
function resetView() {
  return `<div class="narrow">${backButton('settings')}<h1>${t('Reset progress')}</h1><p>${t('Delete reading progress and activity answers for this profile only. Collections and settings are kept.')}</p><p><strong>${e(profile().name)}</strong></p><div class="actions">${button('Export backup','export-current')}${button('Clear this profile’s progress','confirm-reset','danger')}</div></div>`;
}

function openDialog(title, content) { dialog.innerHTML = `<div class="dialog-header"><h2>${t(title)}</h2><button class="icon-button" data-action="close-dialog" aria-label="${t('Close')}">${icon('close')}</button></div>${content}`; if (!dialog.open) dialog.showModal(); }
function closeDialog() { dialog.close(); }
function confirmDialog(message, callback, label = 'Continue') {
  openDialog(label, `<p>${e(t(message))}</p><div class="actions">${button('Cancel','close-dialog')}<button class="primary" id="confirm-action">${t(label)}</button></div>`);
  $('#confirm-action').onclick = async () => { closeDialog(); try { await callback(); } catch(err) { report(err); } };
}
function pinDialog(p) {
  openDialog('Enter PIN', `<p>${e(p.name)}</p><form id="pin-form" class="stack">${field('Enter PIN','<input name="pin" type="password" autocomplete="current-password" required>')}<p id="pin-error" class="form-error" role="alert"></p><button class="primary">${t('Unlock')}</button></form>`);
  $('#pin-form').onsubmit = async event => { event.preventDefault(); const form = event.currentTarget; const submit = $('button',form); submit.disabled=true; try { const result = await hashPin(new FormData(form).get('pin'),p.pin.salt); if (result.hash !== p.pin.hash) { $('#pin-error').textContent = 'That PIN did not match. Try again.'; return; } closeDialog(); await selectProfile(p,true); } catch(err) { report(err); } finally { submit.disabled=false; } };
}
function collectionNameDialog(rename = false, addBookId = null) {
  openDialog(rename ? 'Rename' : 'New collection', `<form id="collection-form" class="stack">${field('Collection name',`<input name="name" required maxlength="80" value="${rename ? e(collection().name) : ''}">`)}<p id="collection-error" class="form-error" role="alert"></p><button class="primary">${t(rename ? 'Save' : 'Create collection')}</button></form>`);
  $('#collection-form').onsubmit = async event => { event.preventDefault(); const name = new FormData(event.currentTarget).get('name').trim(); if (!name) return; if (profile().collections.some(c=>c.name.toLocaleLowerCase() === name.toLocaleLowerCase() && (!rename || c.collectionId !== state.collectionId))) { $('#collection-error').textContent = 'A collection with this name already exists.'; return; } if (rename) collection().name=name; else profile().collections.push({ collectionId:id(),profileId:profile().profileId,name,bookIds:addBookId?[addBookId]:[],createdAt:new Date().toISOString() }); await persist(); closeDialog(); render(); if (addBookId) toast('Added to collection'); };
}
function addCollectionDialog(bookId) {
  openDialog('Add to collection', `<div class="stack">${profile().collections.map(c=>`<button class="secondary" data-action="add-to-existing" data-id="${c.collectionId}" data-book="${bookId}" ${c.bookIds.includes(bookId)?'disabled':''}>${icon(c.bookIds.includes(bookId)?'check':'plus')}${e(c.name)}</button>`).join('')}<button class="primary" data-action="new-collection-for-book" data-id="${bookId}">${icon('plus')}${t('New collection')}</button></div>`);
}
async function readPhoto(file) {
  if (!['image/png','image/jpeg','image/webp'].includes(file.type) || file.size > 5_000_000) throw new Error('Choose a PNG, JPEG, or WebP photo under 5 MB.');
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas'); canvas.width=192; canvas.height=192;
  const context = canvas.getContext('2d'); const side=Math.min(bitmap.width,bitmap.height);
  context.drawImage(bitmap,(bitmap.width-side)/2,(bitmap.height-side)/2,side,side,0,0,192,192); bitmap.close(); return canvas.toDataURL('image/png');
}
async function submitProfile(form) {
  await saveQueue;
  const data = new FormData(form), editing = form.dataset.edit === 'true';
  const name = data.get('name').trim();
  if (!name) throw new Error('Enter a name to create your profile.');
  const p = editing ? structuredClone(profile()) : newProfile(name,data.get('audience'));
  if (editing && p.pin && ((await hashPin(data.get('currentPin') || '',p.pin.salt)).hash !== p.pin.hash)) throw new Error('Enter your current PIN to change this profile.');
  p.name=name; p.audience=data.get('audience'); p.preferences.level=Number(data.get('level'));
  if (editing && p.audience !== profile().audience) p.preferences.filters.audience=p.audience;
  const photo = data.get('photo');
  p.avatar = photo?.size ? await readPhoto(photo) : editing && p.avatar.startsWith('data:') && !state.avatarChanged ? p.avatar : data.get('avatar') || 'leaf';
  if (data.get('removePin')) delete p.pin;
  if (data.get('pin')) p.pin=await hashPin(data.get('pin'));
  await saveProfile(p);
  if (editing) { const idx=state.profiles.findIndex(x=>x.profileId===p.profileId); state.profiles[idx]=p; state.profile=p; go('settings'); toast('Profile saved'); }
  else { state.profiles.push(p); await selectProfile(p,true); navigator.storage?.persist?.().catch(()=>{}); }
  state.avatarChanged=false;
}
async function startReading(restart = false) {
  const b=book(); let r=progress(b);
  if (!r || restart) {
    const fresh={profileId:profile().profileId,bookId:b.id,pageId:b.pages[0].id,status:'in-progress',runId:id(),updatedAt:new Date().toISOString(),contentVersion:b.contentVersion};
    if (r) Object.assign(r,fresh); else { r=fresh; profile().readingProgress.push(r); }
  }
  const i=b.pages.findIndex(p=>p.id===r.pageId); state.page=i<0?0:i;
  r.updatedAt=new Date().toISOString();
  await persist();
  go('reader',{finished:false,resumePrompt:true,animatePage:false});
}
async function pageTurn(index) {
  const b=book();
  if (index>=b.pages.length) { const r=progress(b); r.status='finished'; r.completedAt=new Date().toISOString(); r.updatedAt=r.completedAt; await persist(); state.finished=true; state.navOpen=false; render(); window.scrollTo(0,0); return; }
  state.page=Math.max(0,index); state.finished=false; state.resumePrompt=true; state.animatePage=true;
  const r=progress(b); r.pageId=currentPage().id; r.updatedAt=new Date().toISOString();
  await persist(); render(); window.scrollTo(0,0); $('.reader-paper')?.setAttribute('tabindex','-1'); $('.reader-paper')?.focus({preventScroll:true}); state.animatePage=false;
}
async function setAnswer(questionId,value) { const a=getAttempt(); a.answers[questionId]=value; a.checked=false; a.updatedAt=new Date().toISOString(); await persist(); $$('.feedback').forEach(el=>el.remove()); }
async function retryActivity() { const old=getAttempt(); old.archived=true; state.resumePrompt=false; getAttempt(); await persist(); render(); }
function download(value,name,type='application/json') { const url=URL.createObjectURL(new Blob([value],{type})); const link=document.createElement('a'); link.href=url; link.download=name; link.click(); setTimeout(()=>URL.revokeObjectURL(url),1000); }
async function exportProfiles(selected) { await saveQueue.catch(()=>{}); if (!selected.length) throw new Error('Select at least one profile to export.'); download(JSON.stringify(exportBackup(selected),null,2),`reading-room-backup-${new Date().toISOString().slice(0,10)}.json`); }
async function loadImport(file) {
  if (!file) return;
  if (file.size>20_000_000) throw new Error('Choose a backup smaller than 20 MB.');
  let parsed; try { parsed=JSON.parse(await file.text()); } catch { throw new Error('This file is not valid JSON. Choose an intact Reading Room backup.'); }
  backupPreview=validateBackup(parsed);
  $('#import-preview').innerHTML=`<div class="divider"><h2>${t('Import preview')}</h2>${backupPreview.profiles.map(entry=>`<p><strong>${e(entry.profile.name)}</strong><br><span class="small muted">${entry.readingProgress.length} ${t('books')} · ${entry.activityAttempts.length} ${t('activities')} · ${entry.collections.length} ${t('My Collections')}</span></p>`).join('')}<div class="stack">${[['new','Import as new profile','Create a separate copy with new identifiers.'],['merge','Merge','Combine records; review differences before saving.'],['replace','Replace','Replace the matching local profile and its data.']].map(([v,l,desc])=>`<label class="answer-option"><input type="radio" name="import-mode" value="${v}" ${v==='new'?'checked':''}><span><strong>${t(l)}</strong><br><span class="small muted">${t(desc)}</span></span></label>`).join('')}</div><p class="small muted">${t('Export a backup before replacing any profile. Only matching profiles are replaced.')}</p>${button('Review conflicts','review-import','primary')}<div id="conflicts"></div></div>`;
}
let importPlan;
function reviewImport() {
  if (!backupPreview) return;
  const mode=$('input[name="import-mode"]:checked').value;
  importPlan={mode,conflicts:[]};
  if (mode==='merge') for (const entry of backupPreview.profiles) {
    const local=state.profiles.find(p=>p.profileId===entry.profile.profileId);
    if (!local) continue;
    const merged=mergeProfiles(local,flattenProfile(entry));
    for (const conflict of merged.conflicts) importPlan.conflicts.push({...conflict,profileId:local.profileId,profileName:local.name});
  }
  $('#conflicts').innerHTML=`<div class="divider">${importPlan.conflicts.map((c,i)=>`<div class="conflict"><h3>${e(c.profileName)}: ${e(c.description)}</h3><details><summary>Compare records</summary><p>${t('Keep local')}</p><pre>${e(JSON.stringify(c.local,null,2))}</pre><p>${t('Use imported')}</p><pre>${e(JSON.stringify(c.incoming,null,2))}</pre></details><label class="check-label"><input type="radio" name="conflict-${i}" value="local" required>${t('Keep local')}</label><label class="check-label"><input type="radio" name="conflict-${i}" value="incoming" required>${t('Use imported')}</label></div>`).join('')}${button('Confirm import','commit-import','primary')}</div>`;
  $('#conflicts').scrollIntoView({behavior:'smooth',block:'nearest'});
}
async function commitImport() {
  if (!importPlan || !backupPreview) return;
  if ($('input[name="import-mode"]:checked').value!==importPlan.mode) { reviewImport(); return; }
  const resolutions={};
  for (const [i,c] of importPlan.conflicts.entries()) { const choice=$(`input[name="conflict-${i}"]:checked`); if (!choice) throw new Error('Choose which record to keep for each conflict.'); (resolutions[c.profileId] ||= {})[c.key]=choice.value; }
  const replacements=[];
  for (const entry of backupPreview.profiles) {
    const incoming=flattenProfile(entry), local=state.profiles.find(p=>p.profileId===incoming.profileId);
    replacements.push(importPlan.mode==='new'?importAsNew(entry):importPlan.mode==='merge'&&local?mergeProfiles(local,incoming,resolutions[local.profileId]).profile:incoming);
  }
  const run=async()=>{
    await saveQueue;
    const records=replacements.map(value=>({store:'profiles',value}));
    records.push({store:'recovery',value:{key:'before-import',backup:exportBackup(state.profiles),createdAt:new Date().toISOString()}});
    await writeRecords(records);
    for (const p of replacements) { const i=state.profiles.findIndex(x=>x.profileId===p.profileId); if (i<0) state.profiles.push(p); else state.profiles[i]=p; }
    state.profile=state.profiles.find(p=>p.profileId===profile().profileId);
    backupPreview=null; importPlan=null; render(); toast('Import complete');
  };
  confirmDialog(importPlan.mode==='replace'?'Replace the matching local profile and its data.':'Confirm import',run,'Confirm import');
}

const actions = {
  library:()=>{ if (profile()) go('library'); }, collections:()=>go('collections'), profile:()=>go('profile'), profiles:()=>go('profiles'), create:()=>go('create'), stats:()=>go('stats'), settings:()=>go('settings'), edit:()=>go('edit'), data:()=>{backupPreview=null;go('data');}, reset:()=>go('reset'),
  'close-dialog':closeDialog,
  'select-profile':el=>selectProfile(state.profiles.find(p=>p.profileId===el.dataset.id)),
  details:el=>{ state.detailOrigin=state.route==='collection'?'collection':'library'; go('details',{bookId:el.dataset.id}); },
  'detail-back':()=>go(state.detailOrigin), 'reader-back':()=>go('details'),
  start:()=>startReading(),
  restart:()=>confirmDialog('Start again',()=>startReading(true),'Start again'),
  previous:()=>pageTurn(state.page-1), next:()=>pageTurn(state.page+1), page:el=>pageTurn(Number(el.dataset.index)),
  'toggle-nav':()=>{state.navOpen=!state.navOpen;renderNav();},
  'resume-answers':()=>{state.resumePrompt=false;render();},
  retry:()=>{const a=getAttempt(); if (Object.keys(a.answers).length) confirmDialog('Start again',retryActivity,'Retry'); else return retryActivity();},
  check:async()=>{const a=getAttempt(), page=currentPage(); a.checked=true; a.total=page.questions.length; a.score=page.questions.filter(q=>checkAnswer(q,a.answers[q.id])).length; a.updatedAt=new Date().toISOString(); await persist(); render();},
  reveal:async()=>{const a=getAttempt(); a.revealed=true; a.checked=true; a.total=currentPage().questions.length; a.score=currentPage().questions.filter(q=>checkAnswer(q,a.answers[q.id])).length; a.updatedAt=new Date().toISOString(); await persist();render();},
  'clear-filters':async()=>{profile().preferences.filters={audience:'all',level:'all'};await persist();render();},
  'new-collection':()=>collectionNameDialog(), 'rename-collection':()=>collectionNameDialog(true),
  'new-collection-for-book':el=>collectionNameDialog(false,el.dataset.id),
  'add-collection':el=>addCollectionDialog(el.dataset.id),
  'add-to-existing':async el=>{const c=profile().collections.find(c=>c.collectionId===el.dataset.id);if(!c.bookIds.includes(el.dataset.book))c.bookIds.push(el.dataset.book);await persist();closeDialog();toast('Added to collection');},
  collection:el=>go('collection',{collectionId:el.dataset.id}),
  'delete-collection':()=>confirmDialog('Delete collection',async()=>{profile().collections=profile().collections.filter(c=>c.collectionId!==state.collectionId);await persist();go('collections');},'Delete collection'),
  'move-up':async el=>{const i=Number(el.dataset.index),ids=collection().bookIds;[ids[i-1],ids[i]]=[ids[i],ids[i-1]];await persist();render();},
  'move-down':async el=>{const i=Number(el.dataset.index),ids=collection().bookIds;[ids[i+1],ids[i]]=[ids[i],ids[i+1]];await persist();render();},
  'remove-book':async el=>{collection().bookIds=collection().bookIds.filter(i=>i!==el.dataset.id);await persist();render();},
  'export-current':()=>exportProfiles([profile()]),
  export:()=>exportProfiles(state.profiles.filter(p=>$(`[data-export="${CSS.escape(p.profileId)}"]`)?.checked)),
  'review-import':reviewImport,'commit-import':commitImport,
  'confirm-reset':()=>confirmDialog('Delete reading progress and activity answers for this profile only. Collections and settings are kept.',async()=>{await saveQueue;const snapshot=structuredClone(profile());const cleared={...structuredClone(profile()),readingProgress:[],activityAttempts:[]};await writeRecords([{store:'recovery',value:{key:'before-reset',backup:exportBackup([snapshot])}},{store:'profiles',value:cleared}]);Object.assign(profile(),cleared);render();toast('Progress reset');},'Reset progress'),
  share:async()=>{const text=summary($('#share-name').value.trim());if(navigator.share) {try {await navigator.share({title:t('Your progress'),text});}catch(err){if(err.name!=='AbortError')throw err;}}else {openDialog('Share progress',`<p>${e(text)}</p>${button('Copy summary','copy-summary')}${button('Download summary','download-summary')}`);}},
  'copy-summary':async()=>{const text=summary($('#share-name')?.value.trim());try {await navigator.clipboard.writeText(text);toast('Summary copied');}catch {download(text,'reading-progress.txt','text/plain');}},
  'download-summary':()=>download(summary($('#share-name')?.value.trim()),'reading-progress.txt','text/plain'),
  install:async()=>{await installPrompt?.prompt();installPrompt=null;renderHeader();},
  update:async()=>{await saveQueue;if(state.saveError)throw new Error('Save or export your answers before updating.');waitingWorker?.postMessage({type:'ACTIVATE'});},
  unavailable:()=>toast('This book is unavailable. Your progress is kept.')
};
document.addEventListener('click',event=>{const el=event.target.closest('[data-action]');if(!el||el.disabled)return;const fn=actions[el.dataset.action];if(fn)Promise.resolve().then(()=>fn(el)).catch(report);});
document.addEventListener('submit',async event=>{if(event.target.id!=='profile-form')return;event.preventDefault();const form=event.target,submit=$('[type=submit]',form);submit.disabled=true;try{await submitProfile(form);}catch(err){const error=$('#form-error',form);error.hidden=false;error.textContent=errorText(err);}finally{submit.disabled=false;}});
document.addEventListener('change',async event=>{
  const el=event.target;
  try {
    if (el.dataset.answer) await setAnswer(el.dataset.answer,el.value);
    if (el.dataset.filter) {state.filtersOpen=true;profile().preferences.filters[el.dataset.filter]=el.value;await persist();render();}
    if (el.id==='language') {profile().preferences.language=el.value;await persist();render();}
    if (el.id==='animation') {profile().preferences.animation=el.value;await persist();}
    if (el.name==='avatar') state.avatarChanged=true;
    if (el.id==='import-file') await loadImport(el.files[0]);
    if (el.name==='import-mode') {importPlan=null;$('#conflicts').innerHTML='';}
  }catch(err){report(err);}
});
document.addEventListener('input',event=>{
  const el=event.target;
  if(el.id==='search') {profile().preferences.filters.search=el.value;const books=filteredBooks();$('#books').innerHTML=books.map(bookCard).join('');$('#book-count').textContent=`${books.length} ${t('books')}`;$('#no-books').hidden=!!books.length;persist().catch(()=>{});}
  if(el.dataset.answer && el.tagName==='INPUT'&&el.type==='text') setAnswer(el.dataset.answer,el.value).catch(report);
});
document.addEventListener('dragstart',event=>{const target=event.target.closest('[data-word]');if(target)event.dataTransfer.setData('text/plain',target.dataset.word);});
document.addEventListener('dragover',event=>{const target=event.target.closest('[data-drop]');if(target&&currentPage().activityType==='drag-drop'){event.preventDefault();target.classList.add('drag-over');}});
document.addEventListener('dragleave',event=>event.target.closest('[data-drop]')?.classList.remove('drag-over'));
document.addEventListener('drop',async event=>{const target=event.target.closest('[data-drop]');if(!target)return;event.preventDefault();const value=event.dataTransfer.getData('text/plain');const q=currentPage().questions.find(q=>q.id===target.dataset.drop);if(!q?.options.includes(value))return;await setAnswer(q.id,value);state.resumePrompt=false;render();});
let handleTouch;
document.addEventListener('touchstart',event=>{if(event.target.closest('.nav-handle'))handleTouch=event.changedTouches[0].clientY;else handleTouch=null;},{passive:true});
document.addEventListener('touchend',event=>{if(handleTouch===null||handleTouch===undefined)return;const delta=event.changedTouches[0].clientY-handleTouch;if(Math.abs(delta)>24){state.navOpen=delta<0;renderNav();}handleTouch=null;},{passive:true});
window.addEventListener('popstate',()=>{if(profile()) {state.route=location.hash.slice(1)||'library';if(!['library','collections','profile','stats','settings','data','profiles','edit','reset','create'].includes(state.route))state.route='library';render();}});
window.addEventListener('beforeunload',event=>{if(pendingSaves||state.saveError){event.preventDefault();event.returnValue='';}});
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installPrompt=event;renderHeader();});

async function setupOffline() {
  if(!('serviceWorker' in navigator)){state.offlineError=true;renderHeader();return;}
  try {
    const registration=await navigator.serviceWorker.register('./sw.js');
    function showUpdate() {waitingWorker=registration.waiting;$('#update').innerHTML=`${t('Update available')}${button('Update','update','primary small')}`;}
    if(registration.waiting)showUpdate();
    registration.addEventListener('updatefound',()=>{const worker=registration.installing;worker.addEventListener('statechange',()=>{if(worker.state==='installed'&&navigator.serviceWorker.controller)showUpdate();if(worker.state==='redundant'){state.offlineError=true;renderHeader();}});});
    const hadController=!!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange',()=>{if(hadController)location.reload();else checkOffline();});
    await navigator.serviceWorker.ready;
    await checkOffline();
  }catch(err){state.offlineError=true;renderHeader();console.warn('Offline setup',err);}
}
async function checkOffline() {
  const registration=await navigator.serviceWorker.ready;
  const worker=registration.active;
  if(!worker)return;
  const channel=new MessageChannel();
  const result=await new Promise(resolve=>{const timeout=setTimeout(()=>resolve(false),6000);channel.port1.onmessage=event=>{clearTimeout(timeout);resolve(event.data.ready);};worker.postMessage({type:'CHECK_CACHE'},[channel.port2]);});
  state.offlineReady=!!result;state.offlineError=!result;renderHeader();
}
async function init() {
  try {
    const [profiles,meta,books]=await Promise.all([readAll('profiles'),readAll('appMeta'),loadCatalogue()]);
    state.profiles=profiles;state.books=books;
    const last=meta.find(r=>r.key==='lastProfile')?.value;
    state.profile=profiles.find(p=>p.profileId===last)||null;
    if(state.profile?.pin){state.route='profiles';render();pinDialog(state.profile);state.profile=null;renderNav();}
    else {state.route=state.profile?'library':profiles.length?'profiles':'create';render();}
    setupOffline();
  }catch(err){main.innerHTML=`<section class="error-page"><h1>We couldn’t open your reading room.</h1><p>${e(errorText(err))}</p><p>Your existing data has not been reset. Close other tabs and reload, or reconnect if this is your first visit.</p><button class="primary" onclick="location.reload()">Try again</button></section>`;console.error(err);}
}
init();
