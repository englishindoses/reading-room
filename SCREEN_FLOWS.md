# Screens, navigation and interaction design

Text wireframes describe hierarchy, not final colours or exact sizes. The app should be friendly, clean and **not childish for teenage or adult users**. The three audience themes must share a consistent interaction design.

## A. Launch / profile selection

**Returning user:** Open last-used profile directly to Library. A `Switch profile` action remains available from My Profile.

**First-time user:** Simple welcome with `Create profile` action. Fields: display name (required), avatar (preset/upload), category (Kids / Teens / Adults), initial level (default Level 1), optional PIN/password (can be skipped). No online registration wording.

**Profile picker:** Profile cards with avatar and name, `Open`, and `+ New profile`. PIN prompt only for profiles that opted in. Avoid displaying sensitive backup information on this screen.

## B. Library — landing/main screen

```
┌──────────────────────────────────┐
│ Reading Library        [Search]   │
│                                  │
│ Continue reading                 │  ← Only if something started
│ [cover] Book title   [Continue]   │
│                                  │
│ Browse books                     │
│ [Age ▾] [Level ▾] [Status ▾]      │
│ [Category ▾] [Series ▾] [Sort ▾]  │
│ [cover]   [cover]    [cover]      │
│ Title     Title      Title        │
│ Level 1   Level 2    Level 1      │
│ [+Collection] action on each      │
│                                  │
│                        [Stats]   │  ← compact optional link
├──────────────────────────────────┤
│ [Library] [Collections] [Avatar]  │
└──────────────────────────────────┘
```

- Compact filters: choose one level, contiguous range, or all levels. Support filters by not read / started / finished and title search.
- Cover + title + level remain visible; status badge is permitted if useful. Sorting and filters can use a compact overlay on narrow screens.
- Tapping a cover/card opens **Book Details**, not the book itself.
- `Add to collection` opens collection picker with `Create collection`; prevent duplicate membership.
- Categories = editorial content tags; series = curated ordered book sets; collections = lists created by each user. Do not conflate these.

## C. Book Details — a single book information page

```
[Back to library]                 [+ Collection]

          [ LARGE COVER ]
         Book title
         Level 1 · Teens
         Description (short)
         Status: Not started / In progress / Finished

If new:              [Start reading]
If in progress:      [Continue] [Start again]
If finished:         [Read again] [See results]
```

- `Continue` opens the last saved page/activity and restores its last answers.
- `Start again` starts a new read-through; preserve historical completion stats. Ask confirmation when incomplete answers would be replaced.
- Book-level level/category/series metadata can appear but avoid overloading the page.

## D. Reading view — focus mode

```
┌──────────────────────────────────┐
│ [← Back]        Book title   [≡] │  ← discreet header / menu
│                                  │
│                                  │
│   Page content defined by book   │
│   (text / picture / activity)    │
│                                  │
│                                  │
│ [‹ Previous]       [Next ›]       │
│                                  │
│                  [⌃ Open nav]    │  ← always reachable handle
└──────────────────────────────────┘

When bottom navigation expanded:
┌──────────────────────────────────┐
│ Page index: [1] [2] [3] [4] ...   │
│ [Library] [Collections] [Avatar]  │
│               [⌄ Hide navigation]│
└──────────────────────────────────┘
```

- On entry, the standard bottom nav **slides downward out of view**; keep a visible handle/tab above the safe-area inset. It can be reopened by **tap or upward gesture** (gesture must not compete with content scrolling). When open, page index is displayed in the expanded bottom region.
- A user can tap a page number to jump directly to it, including an activity page. Page labels may be assigned by a book (e.g. `Story`, `Quiz`) but chapter navigation is not required.
- Readers can leave via Back or expanded nav. Save before switching screens.
- Page turning animation setting applies to transitions between pages. **Interactive controls, typing, dropdowns and dragging remain usable independent of the page animation.** Mobile swipe page-turn only if it doesn't interfere with activities.
- Some pages have optional audio player; audio must work offline if supplied in the package.
- On completion, show brief `Book finished` view and options `View results`, `Read again`, `Back to library` (can be part of final page).

## E. Interactive activity page

```
Activity title and clear instructions
[Question items / reusable exercise]

[Check answers]  [Retry]
[See correct answers]

Feedback area (after Check):
- accurate, calm, short
- clue for incorrect answer; no answer giveaway
- answers remain editable; another Check is allowed
```

- For resumed unfinished attempt show `Continue your answers` / `Start again` only when that choice is relevant. Keep prior completed attempt results if retrying or starting a new run.
- For activities with multiple questions, provide per-item feedback when supplied by the author. Avoid interpreting an empty response as correct.
- `See correct answers` explicitly reveals model answers; record that reveal occurred so results can distinguish unaided answers, if later needed. Do not punish users or use patronising language.

## F. My Collections

- List of profile's collections (name, book count), `Create collection`.
- Open a collection: books in chosen manual order (`PROPOSED`), open each book details page.
- Rename, remove a book, reorder books, delete collection (confirm). Deleting a collection **does not delete books or reading progress**.

## G. My Profile

```
[Avatar] Display name
Age category · Current default level

[Check your stats] → Stats
[Settings]         → Settings
[Switch profile]   → Profile picker
```

No standalone Edit Profile or Data on this screen. The bottom navigation's My Profile destination is always the avatar.

## H. Stats

- Finished books, in-progress books, completed activities, optional per-book results (where scored).
- `Share progress` creates a concise shareable **summary**: profile display name (user can edit/omit before sharing), count of books completed, activity completions/results and reporting date (if useful).
- If Web Share API supported, call it from a direct tap. Otherwise offer `Copy summary` or download text/image only if implemented and tested.
- Do not expose private answers in the public share summary by default.

## I. Settings

Organised sections:

1. **Reading**: page-turn style (book-style / simple flip / none); any future reader preferences.
2. **Appearance & language**: switch **app interface** language; theme follows chosen profile category. Explicit message: story text and activities remain as authored.
3. **Edit profile**: display name, avatar, category, default reading level, optional PIN/password.
4. **Data & backup**: Export, Import, backup help; explanations of on-device storage limitations.
5. **Reset progress** (inside a sub-menu): choose current profile progress only; confirmation specifying what is removed. Protect user-created collections/settings unless the option expressly includes them.

## J. Import / export screens

**Export:** Select profile(s) `PROPOSED` default current profile, `Export backup`. Download one versioned `.json` or dedicated extension file containing portable profile data and reading history; avatar images included. Explain that book text/media are bundled with the app, not copied into progress backup.

**Import:** Select a backup file → validate version/content → preview profiles, counts and conflicts → if matching profile exists choose:

- **Replace:** Overwrite this existing profile and its progress with the imported copy. Show irreversible-warning text; recommend a backup first.
- **Merge:** Combine imported and existing progress; when two records conflict, ask which to retain. Never silently discard distinct attempts/collections.
- **Import as new profile:** Create a separate profile from the backup, keeping the existing profile unchanged.

Only commit once the user confirms and validation passes. Show success/failure, never silently create partial imports.

## K. State and navigation behaviour

- Maintain per-profile last book and last page. Current reader page preserved if moving to another main section.
- Return from Book Details to the previous collection or library view (keep current library filters).
- Bottom nav visible on non-reading screens. Reading view has hidden-by-default expandable nav with integrated page index.
- Use explicit touch targets and readable text. Avoid permanently visible toolbars, side panels or redundant dashboards.
