# Product

<!-- impeccable:product-schema 1 -->

## Platform
web

## Users and purpose
Children, teenagers, and adults practicing short reading activities independently or with a teacher. The user explicitly requires mobile-first layouts that also work on a laptop.

## Stack
Implementation choice: dependency-free HTML, CSS, and JavaScript modules, with a Node development server and build script. IndexedDB holds local records. A service worker caches the application and bundled content. This follows the handoff's instruction to make reasoned implementation choices without reopening settled details.

## Capabilities and constraints
The authoritative requirements are PRODUCT_SPEC.md, SCREEN_FLOWS.md, CONTENT_AND_DATA.md, and ACCEPTANCE_TESTS.md. Local profiles, independent UI language, collections, stable content IDs, reusable activities, safe backup/import, and non-destructive updates are required. No accounts, server database, microphone assessment, or cloud sync. Initial content consists of clearly labeled samples, not the production catalogue.

## Accessibility and inclusion
Readable content, keyboard-accessible controls, touch targets, reduced motion, and distinct Kids/Teens/Adults themes with shared functionality.

## Evidence on hand
The six original handoff documents; no commissioned books, brand assets, or implementation. Sample texts will be authored and labeled as demonstrations.

## Product principles
Protect saved answers and history. Separate content from personal records. Keep navigation simple. Verify offline and restore behavior. Clearly report pending work and verification limits.
