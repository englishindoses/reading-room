# Repository Guidelines

## Project Structure & Module Organization

Reading Room is an implemented offline-first reading practice PWA. Application modules live in `src/`, bundled books in `content/`, shared media in `assets/`, Node tooling in `scripts/`, and automated data tests in `tests/`. The root `Sam and the Red Bag/` directory holds print and illustration source files. GitHub Pages deploys the generated `dist/` directory through `.github/workflows/pages.yml`.

- `README.md`: project status and document reading order.
- `PRODUCT_SPEC.md`: requirements, defaults, constraints, and non-goals.
- `SCREEN_FLOWS.md`: navigation, screen layouts, and interactions.
- `CONTENT_AND_DATA.md`: book packages, activity contracts, IndexedDB, and backups.
- `ACCEPTANCE_TESTS.md`: release acceptance scenarios and minimum demo.
- `CODEX_START_HERE.md`: original implementation brief and milestones (historical).
- `IMPLEMENTATION.md`: current scope, verification and release gaps.
- `PRODUCT.md` and `DESIGN.md`: product context and visual system.

## Build, Test, and Development Commands

Use Node.js 22 or newer. Run `npm run dev` for local development, `npm test` for the Node tests, and `npm run build` to generate `dist/`. See `README.md` for browser and design checks and the Windows `npm.cmd` equivalent.

## Coding Style & Naming Conventions

For documentation, use descriptive Markdown headings, short paragraphs, and fenced examples with language identifiers. Preserve exact interface labels and distinguish firm requirements from defaults marked `PROPOSED`.

Use two-space indentation for new JavaScript and preserve the surrounding style. Follow the data contract's stable book/page/activity IDs and versioned schemas; examples include `teen-cvc-sample-001` and `page-01`. Keep app UI translations independent of authored book text.

## Testing Guidelines

Use `ACCEPTANCE_TESTS.md` as the verification checklist. Data tests use Node's built-in test runner. Browser and design checks use headless Chrome. Document changes to test locations and commands in `README.md`. Prioritize profile isolation, saved answers, backup conflict handling, offline launch, and upgrades using populated IndexedDB fixtures. Never report untested behavior as working; identify pending features explicitly.

## Commit & Pull Request Guidelines

This repository tracks `main` on GitHub at `englishindoses/reading-room`. Review `git status` and stage the intended files before committing. Keep generated builds, caches, test output and personal profile backups out of Git. A push to `main` triggers the GitHub Pages workflow. Use concise, imperative commit subjects, such as `Clarify backup merge conflicts`. PRs should describe the change, affected requirements, validation performed, and remaining TODOs. Link relevant issues when available; include screenshots for implemented UI changes.

## Agent-Specific Instructions

Before changing the app, read `PRODUCT_SPEC.md`, `SCREEN_FLOWS.md`, `CONTENT_AND_DATA.md` and `ACCEPTANCE_TESTS.md` completely. Preserve user data during migrations and updates; never reset IndexedDB to recover from migration failures. Keep bundled content separate from user records and keep the bundled catalogue scoped to approved books.
