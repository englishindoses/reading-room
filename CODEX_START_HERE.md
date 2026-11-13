# Codex implementation handoff — paste this when ready to build

> Build the installable offline-first reading practice PWA described in the attached design documents. **Before coding**, read `PRODUCT_SPEC.md`, `SCREEN_FLOWS.md`, `CONTENT_AND_DATA.md`, and `ACCEPTANCE_TESTS.md` completely. Treat firm product decisions as requirements and `PROPOSED` choices as editable defaults. Avoid asking the product owner to reconfirm settled details. Only ask a question if a true blocker exists; otherwise document a reasoned implementation choice.
>
> Use a maintainable, mobile-first architecture with reusable book page renderers and activity components. All user data lives in IndexedDB and must survive content updates, reloads, service-worker upgrades and versioned DB migrations. Never reset data as a fallback to a failed migration. Bundle all first-release book media for offline use. Make UI language independent of book language. Implement the bottom nav as specified, including automatic hide in book mode and expandable integrated page index.
>
> **Do not implement the full production book catalogue.** Use clearly labelled sample packages to test a story-first book and a pre-reading → story → activity book. First implement the product shell and a working end-to-end slice. Provide working tests for local save, backup/import conflict options, offline operation and update safety.
>
> Do not claim something works unless tested. For features left for a subsequent milestone, mark them clearly as `TODO` and keep the extension point ready.

## Suggested implementation milestones

### M1. Shell, navigation, profiles
- Scaffold responsive PWA, manifest, service worker and offline status.
- Core design tokens for Kids/Teens/Adults, app language dictionary, Library / My Collections / My Profile bar.
- IndexedDB schema + profiles and last-used profile persistence; optional PIN.
- Reader layout and auto-hide/reveal bottom nav with integrated page index.

### M2. Content engine & first book
- Book-package loader, registry, stable IDs and asset bundling.
- Library search/filter/sort, book details, personalised collections.
- Sample book package; page navigation with 3 animation options.
- Record last page and finished state.

### M3. Activity engine
- Common renderer/state/check/retry/reveal contract.
- Implement core activity types incrementally, beginning with MCQ and true/false; then matching, drag-drop, typed gap and dropdown gap.
- Autosave and Continue / Start again; result history; per-question hints authored by creator.

### M4. Backup, stats, share & update integrity
- Versioned profile backup export/import with Replace/Merge/Import as new profile; preview and conflict resolution.
- Profile stats and native share fallback.
- Service worker update notification, safe reload and migration test suite.
- Thorough offline test, accessibility/interaction testing, mobile and desktop passes.

## Design principles

1. The app is for **short reading activities**, not a novel reader.
2. Avoid navigation duplication, unnecessary settings and low-value progress metrics.
3. Keep user data and bundled book assets strictly separate.
4. Do not hardcode reading-level progression or page layouts.
5. Protect active answers and historical progress, especially during updates and imports.
6. Keep the code understandable for an individual developer maintaining the catalogue through app releases; content-management UI is **future** work.

## Required handoff from Codex after each milestone

- What was implemented and what remains TODO.
- Where to edit UI text, themes, book packages, activity components and schema migrations.
- How to run locally and verify offline / PWA installation.
- How to execute acceptance tests and backup/upgrade test fixtures.
- Any deviations from these documents with reasons.
