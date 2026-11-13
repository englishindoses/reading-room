# Product specification — Reading App

## 1. Purpose

A downloadable/installable **Progressive Web App (PWA)** for independent reading practice or teacher-led lessons. Readers choose a local profile, open short books/stories and complete interactive exercises. Content is suitable for kids, teens and adults. **These are short reading activities, not novels:** avoid unnecessary chapter, bookmark and long-form-reader features.

## 2. Firm product decisions

- Installable PWA; **fully usable offline after the first successful installation/content cache**, including bundled books, images and any included audio.
- **IndexedDB** stores local profiles, preferences, progress, answers, results and user-selected avatar images. No external login or online synchronisation.
- On launch, reopen the **last-used profile** automatically, with an obvious way to switch profiles. If none exists, show profile creation.
- Profile: name + predefined avatar OR uploaded image; optional PIN/password (for privacy/convenience, not a substitute for a secure online account).
- Three initial themes: **Kids / Teens / Adults**. Profiles have an age category and each book has audience metadata. Reading categories organise the library; they do not imply unsafe or adult-only material. Adult readers may browse younger categories. Category can be changed from profile settings. **Default age filtering** should respect selected category; changing category is not locked behind parental controls.
- Reading difficulty is a **custom numbered scale**, separate from CEFR. **Level 1** begins with CVC-rich, easy-to-understand texts. Higher levels are added as content is produced, with age-specific variation possible. Do not hardcode phonics rules in the app.
- Library shows book cover, title, level. Filter by single level, range, or all; status (Not started / In progress / Finished); age/category and series where relevant. Sort books. Display continue-reading content near the top.
- Library supports individually listed books, categories, series, and **user-created collections**. Add-to-collection action is available on book tiles and book details.
- Clicking a book opens its **book details page**: cover, title, level, short description and reading status. If new: **Start reading**. If started: **Continue** and **Start again**. A finished book may be reread.
- Each book defines its **own sequence/layout**: story-first, pre-reading → story → post-reading, or other arrangements. The system must allow image/text/audio pages and reusable interactive activities.
- Planned activity types include multiple choice, matching, drag-and-drop, typed gap-fill, dropdown selection and true/false; more can be added. **No microphone-based pronunciation/speaking tasks.**
- For exercises: user presses **Check answers** to see feedback, correct their work and check again; **Retry** resets that activity; **See correct answers** is available. Feedback is encouraging and precise, with useful clues that do not give away the answer before the user opts to reveal it.
- Returning to an unfinished activity offers **Continue** (restore latest answers) or **Start again** (reset this attempt); retain prior completed results in the data model.
- Page-turning modes in Settings: **Book-style realistic turning**, **simple flip/transition**, **none**. Follow OS reduced-motion preference by default until the user explicitly selects a mode. The UI remains usable when animation is disabled.
- **Bottom navigation bar:** `Library`, `My Collections`, `My Profile` (avatar icon). My Profile contains **Stats**, **Settings**, **Switch Profile**. **Edit Profile** and **Data** (export/import) live *inside Settings*, not on the top-level profile page.
- When a book opens, bottom navigation **slides down / hides** to maximise reading area; a persistent, unobtrusive handle allows users to **slide/tap it back up**. While a book is open, expanded bottom navigation also exposes a **page index/navigation strip**. It must be possible to hide it again without leaving the book.
- Profile stats have a dedicated page accessible via My Profile; display useful progress, not low-value click tracking. A compact **Check your stats** entry is acceptable on the library landing area.
- App UI language is switchable **without translating book/story/activity content**. `PROPOSED`: initial UI languages English and Brazilian Portuguese; translation resources should make more languages easy to add.
- Show **Update available → Update** when an offline-capable new version is installed and ready. Updates must preserve user profiles and progress. Use safe, versioned migrations; never treat a cache update as permission to clear IndexedDB.
- Allow downloading a portable backup file and re-importing it on the same or another device. Import offers **Replace**, **Merge**, **Import as new profile**, with plain-language explanations and previews. Offer phone-native share for a **progress summary**, with fallback when Web Share API is unavailable.
- Settings should be grouped logically; **Reset progress** belongs in a submenu and requires a clear confirmation. Avoid clutter.
- Content authoring: **books bundled via app updates in v1**, but represented as independent, versioned content packages so an in-app content-management interface can be added in a future phase.

## 3. Navigation map

```
Launch
 ├─ No saved profile → Create profile → Library
 ├─ Previous profile found → Library (last-used profile)
 └─ Switch profile → Profile picker → Library

Main bottom bar
 ├─ Library
 │   ├─ Continue reading
 │   ├─ Book browsing / search / filters / sort
 │   └─ Book details → Reading view (bottom bar initially hidden)
 │                     ├─ Pages / activities
 │                     └─ Expand bottom bar → page index + main navigation
 ├─ My Collections
 │   ├─ Create / rename / delete collection
 │   └─ Collection → books → Book details
 └─ My Profile (avatar)
     ├─ Stats
     ├─ Settings
     │   ├─ Reading & animations
     │   ├─ Appearance & interface language
     │   ├─ Edit profile (name, avatar, audience, optional PIN)
     │   ├─ Data (Export / Import / Restore)
     │   └─ Reset progress (sub-menu, confirmation)
     └─ Switch profile
```

## 4. Proposed usability defaults (editable)

- `PROPOSED` App opens to **Library** for the last-used profile. When no books are started, hide the empty Continue Reading section.
- `PROPOSED` Library default filter = profile audience + profile's current reading level; offer quick switch to all levels / range. Filters persist per profile.
- `PROPOSED` Default sort = title A–Z, with options Recently opened, Level ascending/descending and Status.
- `PROPOSED` My Collections shows a simple empty state and a New collection action; collections are personal to the current profile.
- `PROPOSED` Book details allow Start again only after a confirmation if it will replace current incomplete answers; completed history remains available in stats.
- `PROPOSED` In-book controls use left/right page arrows and optional swipe gesture on touch. Interacting with a drag-and-drop exercise must **not** trigger a page turn.
- `PROPOSED` Page index uses small numbered chips/thumbnails; activity pages receive a visual marker. Keep the bottom navigation compact and expandable.
- `PROPOSED` No gamified points/streaks/achievements initially. Stats focus on books opened, in progress, finished, completed activities, and results where relevant. **Do not log individual clicks**.
- `PROPOSED` Interface layout is responsive (phone-first; tablet and desktop supported). Theme adjusts colour, illustration accents and presentation to audience, while functionality remains consistent.

## 5. Non-goals for first release

- No remote accounts, cloud database, social network, teacher dashboard or cross-device sync.
- No adult/explicit content; no parental-control/age-verification infrastructure.
- No spoken-answer/microphone assessment.
- No requirement to finish defining later reading levels now.
- No authoring/content-management UI in v1 (put on future roadmap).
- No automatic grading of free-form language responses beyond explicitly configured acceptable answers.

## 6. Important constraints and honest limitations

- **Offline-first:** a user's first visit needs internet to obtain the app and all bundled assets; service worker caching and browser storage limits can affect availability. Test cold launch in airplane mode *after* installation.
- **Browser data can be lost** through user deletion, OS/browser eviction, device damage or app removal. Offer clear export and import; request persistent storage where supported, but don't claim it is guaranteed.
- **PIN/password** can make casual profile switching less convenient, but cannot ensure account-grade protection when all data is stored client-side. Document how it's stored and avoid storing a PIN in plain text.
- **Automatic updates are not risk-free.** Preserve IndexedDB in service-worker upgrades, use migration/backup/rollback strategies and test updates against real sample data. Do not promise absolute prevention of data loss.
- **Native sharing** requires supported browser/platform/context; fall back to downloading or copying a progress summary.
- Realistic page curl can be performance-intensive and awkward for interactive pages: use book-style animation only for page transitions, not around draggable or focused controls; offer simple/none fallback.

## 7. Future backlog (not first release)

- In-app **content management** (import/create/edit/publish books without manually changing app code).
- Expanded activity library and optional additional UI languages.
- Additional reading levels and revised level descriptors by age as content grows.
- Optional teacher-specific features, only if requested later.
