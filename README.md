# Reading Room

**Status:** Working first release with two sample books; see `IMPLEMENTATION.md` for verification and remaining release checks.  
**Product:** Installable, offline-first reading practice web app (PWA) for children, teenagers and adults.  
**Audience for these documents:** Contributors and product owner.

## Run locally

Requires Node.js 22 or newer. No dependency installation is needed.

```sh
npm run dev
```

Open **http://localhost:4173** and create a profile. On Windows, use `npm.cmd` if PowerShell blocks `npm.ps1`. Stop the server with Ctrl+C.

```sh
npm test            # backup, merge, content and scoring tests
npm run test:browser # Chrome browser checks; start the dev server first
npm run test:design  # responsive screens and contrast across audience themes
npm run build       # creates the static app in dist/
node scripts/server.mjs --dist # serve the generated app
```

The browser suite uses an isolated temporary Chrome profile, requires Chrome installed at its normal Windows location (or set `CHROME_PATH`), and writes results to `test-results/`. It temporarily changes `sw.js` to test an actual update and restores it afterward; run it against a development server without other edits in progress. Chrome runs headlessly with its process sandbox disabled for this restricted test environment; this does not affect the app or the user's browser.

## Use on a phone or laptop

The interface starts with phone layouts and expands at 600px and 960px. A deployed HTTPS origin works across devices. `localhost` refers to the current device, so the laptop localhost URL is for the laptop only. Local device testing over plain LAN HTTP cannot install a service worker; use HTTPS for phone offline/PWA testing.

After **Ready offline** appears, disconnect and reload to use bundled stories and activities. Use **Install app** where the browser supports installation; on iOS use Safari's Share → Add to Home Screen. Installation and browser storage behavior still need physical-device checks.

## Source map

- `src/app.js`: navigation, screens, profiles, reading, activity rendering, collections, settings.
- `src/db.js`: IndexedDB and additive migrations; `src/backup.js`: backup validation and conflict planning.
- `src/content.js`: package loader, supported activity registry, and authored-answer scoring.
- `src/pages.js`: extensible story, intro, image, audio, and mixed page renderers.
- `src/i18n.js`: English/Brazilian Portuguese UI dictionary; book text remains as authored.
- `src/styles.css`: responsive layouts and shared Kids/Teens/Adults theme tokens.
- `content/catalogue.json`: book registry; each folder contains its `book.json` and cover asset.
- `sw.js`: versioned offline assets and coordinated updates; `manifest.webmanifest`: PWA metadata.
- `tests/` and `scripts/browser-test.mjs`: automated verification.

## Save and update safely

All personal records stay in IndexedDB on the current browser and origin. Export selected profiles from **My Profile → Settings → Data & backup**. Imports validate before writing and offer **Replace**, **Merge**, and **Import as new profile**, with explicit conflict choices. Backups include photos, PIN hash metadata, preferences, answers, history, and collections; keep exported files private. The last pre-import/reset recovery snapshot is also retained locally.

Deploy `dist/` on a static HTTPS host. After changing any shipped code/content, change the asset-cache version in `sw.js` and update its asset list for new files. Test upgrades with populated data. Worker updates wait for **Update** and pending saves; migrations never reset IndexedDB. A PIN discourages casual profile access and is not encryption of the local database.

## GitHub Pages hosting

GitHub Pages is the intended PWA host. `.github/workflows/pages.yml` tests and builds the app, uploads only `dist/`, and deploys through the `github-pages` environment on pushes to `main` or manual workflow runs. All application, manifest, content, and service-worker URLs are relative so they work beneath `/reading-room/`.

The public repository deploys to **https://englishindoses.github.io/reading-room/**. GitHub Pages uses **GitHub Actions** as its source. Future successful pushes to `main` publish automatically. GitHub Pages is the PWA host; the earlier ChatGPT Sites deployment is not used for releases.

## Read in this order

1. `PRODUCT_SPEC.md` — behaviour, navigation, requirements, defaults and non-goals.
2. `SCREEN_FLOWS.md` — screen-by-screen layout, navigation and interactions.
3. `CONTENT_AND_DATA.md` — editable book content model, activity interface, IndexedDB data, backup semantics.
4. `ACCEPTANCE_TESTS.md` — what must work before release.
5. `CODEX_START_HERE.md` — ready-to-paste implementation brief and build sequence.

## Key rule

The user authorized implementation after this design handoff. Proposed defaults are marked `PROPOSED` and can be changed later. Avoid reopening settled decisions unless technically impossible or contradictory.

The first release can ship with a *small sample* of book/activity content, but the app structure must support books with bespoke page sequences and reusable activity components. No server, accounts, subscriptions or cloud sync in v1.
