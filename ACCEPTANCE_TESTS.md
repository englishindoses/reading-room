# Acceptance tests — definition of done

Use these as manual end-to-end scenarios plus automated tests where practical. **A visually appealing prototype is not considered finished if offline, progress and restore fail.**

## Profiles

- [ ] First launch shows Create profile; after creating one, opens Library.
- [ ] Closing/reopening the app opens directly into last-used profile.
- [ ] Switch profile shows all local profiles; changes do not mix reading progress, collections or settings.
- [ ] Profile accepts preset avatar or uploaded photo; shows consistent image on Library/Profile/bottom nav; imported photo survives restore.
- [ ] Optional PIN/password can be enabled, verified, changed and disabled without storing cleartext. A skipped PIN never blocks access.
- [ ] Changing audience changes default library content display; switching age category is possible and does not erase progress.

## Library / details / collections

- [ ] Library shows cover, title and numbered reading level on all cards.
- [ ] A user can select one level, a range or all levels, and filter Not started / In progress / Finished.
- [ ] Search, sort, categories and series produce correct results; changing filter does not clear progress.
- [ ] From a book tile and from its details page, a user can add it to a collection.
- [ ] Collections can be created, renamed, reordered and deleted; removing a collection does not remove progress or books.
- [ ] Opening a new book lands on its details page with Start reading.
- [ ] Opening an in-progress book lands on its details page with Continue and Start again.
- [ ] Continue resumes exact page and saved answers; Start again behaves as warned.

## Reading and activities

- [ ] Books can define nonuniform page sequences and page layouts without duplicating navigation code.
- [ ] Open book hides bottom nav automatically; reader can expand/collapse using tap or swipe handle; page index appears in expanded nav.
- [ ] Tapping any page in the index navigates to it; expanded bar still permits Library, My Collections and My Profile.
- [ ] Page-turn setting supports realistic book-style, simple flip and none; no mode makes activity inputs unusable.
- [ ] Swipe navigation never steals drag-and-drop, dropdown use, text selection or ordinary scrolling.
- [ ] Book images and any supplied audio work after installation in airplane mode.
- [ ] An activity lets users enter answers, Check answers, read appropriate hints, correct answers, Check again, Retry and See correct answers.
- [ ] After leaving an unfinished activity, returning offers Continue (saved answers) or Start again.
- [ ] Finished status and relevant activity results show up in Stats; progress is not dependent on click logs.

## Settings / translation / sharing

- [ ] Bottom nav destinations are exactly Library / My Collections / My Profile, with My Profile shown via avatar.
- [ ] My Profile contains Stats, Settings, Switch profile; Edit profile and Data are nested in Settings.
- [ ] Reset progress is nested, requires explicit confirmation and affects only the described records.
- [ ] App language toggle changes navigation/buttons/feedback UI without translating story or authored activity text.
- [ ] Share progress invokes native share when available and a fallback elsewhere; shared content excludes private answers/backups/PIN.

## IndexedDB / backup / import

- [ ] Reloading, closing or restarting the installed app retains profile, avatar, preferences, collections, last page, answers and results.
- [ ] Exported backup can be imported on the original device and a different device with same app version.
- [ ] Export includes all selected profile data necessary for progress restoration (including avatar) but not redundant book media.
- [ ] Import preview offers Replace, Merge and Import as new profile with unambiguous explanations.
- [ ] Import as new profile creates new IDs and does not change the existing profile.
- [ ] Replace affects only explicitly selected profile(s) and warns before overwriting.
- [ ] Merge combines non-conflicting progress and collections; genuine conflicts prompt rather than silently dropping records.
- [ ] Invalid, truncated, maliciously malformed and unsupported-version backup files do not corrupt local records.
- [ ] Repeated import and export preserves data consistency; duplicate attempts/collections aren't created accidentally on repeated merges.

## PWA / updates / offline integrity

- [ ] Installable on major current desktop/mobile browsers where PWA installation is supported; otherwise works as a website.
- [ ] After first successful cache, airplane-mode launch works and all shipped books, images, activity code and bundled audio remain usable.
- [ ] New deployed release displays Update available + user-triggered Update when appropriate.
- [ ] **Critical:** Upgrade from a prior release with populated IndexedDB preserves all profiles, avatars, collections, answers, progress and preferences.
- [ ] Interrupted/failed update does not clear IndexedDB, active reading state or reset application data.
- [ ] Content update retains historical progress for unchanged book/page IDs and handles changed IDs predictably.
- [ ] Failing persistent-storage permission does not crash the app; export functionality still works.

## Responsive / visual design

- [ ] Phone portrait, tablet and desktop widths have readable cards, controls and reader page without horizontal overflow.
- [ ] Different Kids/Teens/Adults themes are clearly distinct yet share same navigation and behaviour.
- [ ] Teen/adult themes are not childish; reading content remains legible across theme choices.
- [ ] All three animation modes and expanded nav controls work with keyboard/touch; controls have accessible labels.

## Minimum developer demo

Show two test profiles with distinct settings/progress, two sample books with different structures, at least one scorable activity, a collection, a local backup that can be imported, offline reload, and an update migration test using populated fixture data. Any activity type not yet implemented must be explicitly listed as pending, not silently presented as completed.
