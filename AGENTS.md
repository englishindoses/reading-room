# Repository Guidelines

## Project Structure & Module Organization

This repository currently contains a design handoff for an offline-first reading practice PWA; implementation has not started. All files live at the root. There are no source, test, or asset directories yet.

- `README.md`: project status and document reading order.
- `PRODUCT_SPEC.md`: requirements, defaults, constraints, and non-goals.
- `SCREEN_FLOWS.md`: navigation, screen layouts, and interactions.
- `CONTENT_AND_DATA.md`: book packages, activity contracts, IndexedDB, and backups.
- `ACCEPTANCE_TESTS.md`: release acceptance scenarios and minimum demo.
- `CODEX_START_HERE.md`: implementation milestones and handoff expectations.

## Build, Test, and Development Commands

No build system, dependency manifest, development server, or test runner is configured. Do not assume commands such as `npm run dev` or `npm test` exist. When implementation is authorized, document the actual setup, development, build, and test commands in `README.md` alongside the chosen tooling.

## Coding Style & Naming Conventions

For documentation, use descriptive Markdown headings, short paragraphs, and fenced examples with language identifiers. Preserve exact interface labels and distinguish firm requirements from defaults marked `PROPOSED`.

No code indentation, formatter, or linter convention has been established. Define these when scaffolding. Follow the data contract's stable book/page/activity IDs and versioned schemas; examples include `teen-cvc-sample-001` and `page-01`. Keep app UI translations independent of authored book text.

## Testing Guidelines

Use `ACCEPTANCE_TESTS.md` as the verification checklist. No automated framework, test naming convention, or numeric coverage threshold exists yet. When adding executable tests, document their location and commands. Prioritize profile isolation, saved answers, backup conflict handling, offline launch, and upgrades using populated IndexedDB fixtures. Never report untested behavior as working; identify pending features explicitly.

## Commit & Pull Request Guidelines

No Git metadata or commit history is available in this checkout. Use concise, imperative commit subjects, such as `Clarify backup merge conflicts`. PRs should describe the change, affected requirements, validation performed, and remaining TODOs. Link relevant issues when available; include screenshots for implemented UI changes.

## Agent-Specific Instructions

Do not begin app implementation until explicitly asked to build. Before coding, read the four specification and acceptance documents completely. Preserve user data during migrations and updates; never reset IndexedDB to recover from migration failures. Keep bundled content separate from user records and limit initial content to clearly labeled sample packages.
