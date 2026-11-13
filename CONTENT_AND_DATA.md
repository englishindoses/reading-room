# Content architecture and local-data contract

This file gives Codex a concrete starting shape while permitting changes to field names. **Prioritise behaviour and future content compatibility over exact JSON keys.**

## 1. Separation of concerns

1. **App shell:** installation, service worker, navigation, UI themes and translations.
2. **Book packages:** read-only, bundled JSON manifests plus media assets, updated with releases.
3. **Activity renderers:** reusable components selected by a content type, with consistent check/retry/reveal interface.
4. **User data:** IndexedDB profiles, preferences, latest read-through, results, collections and backup metadata. **Never store this in the service worker cache.**

Book packages must not require editing a central component for each new book; package registry/catalogue may be rebuilt at release time.

## 2. Book-package example (illustrative, not prescribed content)

```json
{
  "schemaVersion": 1,
  "id": "teen-cvc-sample-001",
  "contentVersion": 1,
  "title": "A Cat on a Mat",
  "description": "A short reading practice story.",
  "readingLevel": 1,
  "audiences": ["teens", "adults"],
  "categories": ["phonics", "short stories"],
  "seriesId": "first-reads",
  "seriesOrder": 1,
  "cover": "./cover.webp",
  "pages": [
    {"id": "page-01", "type": "story", "layout": "image-above-text", "image": "./p1.webp", "text": "A cat sat on a mat."},
    {"id": "page-02", "type": "activity", "activityType": "multiple-choice", "title": "Check the story", "questions": [{"id": "q1", "prompt": "Where was the cat?", "options": ["On a mat", "In a box"], "correctOption": 0, "hint": "Look at the last three words of the story."}]}
  ]
}
```

**Notes:**
- The text above is a **technical placeholder, not a commissioned book or reading-level definition**.
- A book's `pages` array is its canonical navigation order. Do not impose uniform stages or page templates.
- Page types can include `story`, `intro`, `activity`, `image`, `audio`, and `mixed` as needed. Author controls per-page layout; new layout types can be registered.
- Each page and activity must have a **stable ID** across content updates, so progress and results can be migrated reliably. If an author makes a breaking change, increment `contentVersion` and provide a migration or keep historical results read-only.
- Assets should be relative to book package paths and include fallback/alt text. Avoid remote-only assets (offline requirement).
- Book metadata may support an age/interest tag and an audience list. No mandatory age-verification gate.
- Preserve existing book IDs after releases. Removed/renamed books must not delete historical profile progress; show an unavailable-book placeholder where appropriate.

## 3. Activity interface / proposed contract

Every activity renderer should accept its page definition and saved state and expose these capabilities:

```
render(activityDefinition, savedAnswers, checkState)
setAnswer(questionId, value)    // autosave debounced / on change
checkAnswers()                  // score when scoreable; feedback + hints
retry()                         // new blank attempt; preserve history
showCorrectAnswers()            // explicit reveal
restore(attemptId)              // continue unfinished attempt
```

- Maintain a neutral status per answer: unattempted, correct, incorrect, revealed (where relevant).
- Provide a **hint per question or per activity** in authored content; do not synthesize answers or give them away in advance.
- Support typed answers with configurable accepted answers and normalisation defined per activity (e.g. whitespace/case rules). Do not arbitrarily accept incorrect spellings.
- Exercise families initial architectural targets: `multiple-choice`, `matching`, `drag-drop`, `typed-gap`, `select-gap`, `true-false`. Additional types can be plugged in. Implementing all renderers at once is not required for the first vertical slice.
- Activity components must be keyboard-accessible and have non-drag fallback for drag-and-drop matching/reordering.

## 4. IndexedDB object-store proposal

Database name: `reading-app`, versioned migrations. Suggested stores:

| Store | Key | Contents |
|---|---|---|
| `profiles` | `profileId` | name, audience, avatar record/reference, optional PIN hash metadata, created/updated timestamps |
| `preferences` | `profileId` | interface language, animation choice, default level, library filters, theme preferences |
| `readingProgress` | `[profileId, bookId]` | status, latest page ID, active read-through ID, started/completed timestamps |
| `activityAttempts` | `attemptId` | profileId, bookId, page/activityId, answers, check status, results, reveal flag, timestamps |
| `collections` | `collectionId` | profileId, name, ordered list of book IDs, timestamps |
| `profileMeta` | `profileId` | local profile-specific auxiliary info; optional |
| `appMeta` | `key` | last-used profileId, schema/migration state, last seen update |

- `avatar` can use IndexedDB Blob if feasible (with limits/resizing); backup should encode it portably.
- Do not save every individual interaction/click. Save useful current answers, book position and activity outcomes.
- `status`: not-started (implicit), in-progress, finished. 'Finished' should be derived from book completion, not assuming all exercises scored 100%.
- Updating a book must not wipe user data; versioned migration should retain unknown/unmatched history where practical.
- Do not change existing public IDs casually. Index progress by profile and book; index attempts by profile/book/page for efficient stats.

## 5. Backup and restore contract

**File:** single portable UTF-8 JSON document (`.json`, `application/json`), downloadable locally. Version and validate before importing. Include data for chosen profiles including their avatar images, preferences, progress, activity attempt records and user collections. Avoid serialising compiled application assets/book content.

Envelope shape:

```json
{
  "format": "reading-app-backup",
  "formatVersion": 1,
  "exportedAt": "2026-11-12T00:00:00.000Z",
  "appVersion": "0.1.0",
  "profiles": [
    {
      "profile": {"profileId": "uuid", "name": "Reader", "audience": "teens"},
      "preferences": {},
      "readingProgress": [],
      "activityAttempts": [],
      "collections": []
    }
  ]
}
```

(Full schema must also carry avatar content; if PIN is included, never export plain text. Let users clear/reset PIN on import if platform limitations require it.)

**Import identity:** use stable `profileId` to recognise the same profile across exports; handle duplicate IDs safely when importing as a new profile by generating a new profileId and rewriting all child references.

**Three conflict options, with explanations:**

1. **Replace** — Overwrite the local profile with its imported copy. Show impact preview and require confirmation.
2. **Merge** — Combine both sets of progress; preserve distinct attempt IDs, union non-conflicting records, ask about genuine clashes (e.g. contradictory current answers for the same active attempt, same collection name with different books, or incompatible profiles). Prefer a conflict review to arbitrary latest-timestamp rules.
3. **Import as new profile** — Add a separate copy, retaining the old profile and its data.

**Critical safety requirements:**
- Parse and validate full file before writing; reject corrupt, unknown-format or unsupported-future-version files with actionable error.
- Build a dry-run preview: profile(s), relevant counts, conflicts and chosen action.
- Preserve existing data on failed import. Execute chosen import changes atomically in one IndexedDB transaction wherever possible; do not partially replace.
- Keep a local recovery snapshot or provide an export-before-replace flow (safest for explicit destructive actions).
- Merge must never silently erase newer or distinct attempts or collections. If true conflict cannot be resolved automatically, ask the user.
- Restore to same or a new device must not require internet **once the app is installed**.

## 6. PWA update/data guarantees — engineering rules

- App shell and book assets use an offline-capable service worker precache strategy; background updates download new versions and display an **Update available** prompt before activation when supported.
- `skipWaiting` / `clients.claim` or equivalents must be coordinated so active book work is saved before a reload.
- **Never clear IndexedDB, user exports, or user settings during service-worker activation, cache cleanup or content catalogue refresh.** Cache cleanup applies exclusively to safe, old *app asset caches*.
- Version/upgrade IndexedDB with reversible or guarded migration steps; test migration from older fixtures before release. Migrations should not silently discard data when new book versions are deployed.
- Failing upgrade → app reports error and retains last valid data; no reset fallback.
- Attempt persistent browser storage (`navigator.storage.persist`) where supported, but continue working if declined.
- Ensure all required app assets and shipped book media have been cached *before* displaying `Ready offline`. Provide honest status if offline download is incomplete.

## 7. Share progress

- Generate summary from saved activity results, **not click tracking**.
- Concise share text sample: `Reading progress: 4 books finished, 2 in progress, 9 activities completed.`
- Direct user-initiated `navigator.share` for compatible phones. Otherwise `Copy summary` and download fallback if useful.
- Avoid including unique profile ID, user backup, PIN or typed answers in a shared summary.

## 8. Translation and themes

- UI messages stored in translation dictionaries independent from the content packages.
- `PROPOSED` v1 UI locales: English / pt-BR. Book text/activities/audio display exactly as authored, without automatic translation.
- Themes (Kids, Teens, Adults) are design tokens: typography, spacing, colours, accents. Do **not** create three implementations of the app.
