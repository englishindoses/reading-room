---
name: Reading Room
description: A warm, quiet library for independent reading practice.
colors:
  paper: "#f6e7ce"
  surface: "#fffcf4"
  ink: "#24382c"
  muted: "#705b43"
  accent: "#20513d"
  accent-hover: "#153b2b"
  tint: "#e1e8d1"
  line: "#d5bea0"
  warm: "#ab482e"
  error: "#9e3025"
  focus: "#975114"
  white: "#fff"
  feature: "#183f32"
  feature-ink: "#fff3d7"
  feature-muted: "#e9dcc4"
  honey: "#f1be59"
  peach: "#f0d0ad"
  kids-feature: "#84391f"
  kids-feature-muted: "#ffe0bc"
  kids-peach: "#ffcf96"
  teens-feature: "#60364f"
  teens-feature-muted: "#f2d8e2"
  teens-peach: "#ecc4bd"
  kids-paper: "#ffebc8"
  kids-accent: "#9b4325"
  kids-accent-hover: "#753119"
  kids-ink: "#49301f"
  kids-muted: "#795337"
  kids-tint: "#ffe0a5"
  kids-line: "#dfb580"
  kids-warm: "#a84625"
  teens-paper: "#f3e4db"
  teens-accent: "#67415b"
  teens-accent-hover: "#4d2d42"
  teens-ink: "#432c3a"
  teens-muted: "#775969"
  teens-tint: "#ead3dc"
  teens-line: "#d6b7c2"
  teens-warm: "#a64e42"
typography:
  feature-mobile:
    fontSize: "1.875rem"
  feature-tablet:
    fontSize: "2.5rem"
  feature-desktop:
    fontSize: "2.75rem"
  section-heading:
    fontSize: "1.5rem"
  aside-heading:
    fontSize: "1.75rem"
  book-title:
    fontSize: "1.125rem"
  activity-legend:
    fontSize: "1.0625rem"
  book-meta:
    fontSize: ".8125rem"
  badge:
    fontSize: ".75rem"
  nav-compact:
    fontSize: ".6875rem"
  headline:
    fontFamily: '"Segoe UI", system-ui, sans-serif'
    fontSize: "2rem"
    fontWeight: 650
    lineHeight: 1.15
    letterSpacing: "-.035em"
  title:
    fontFamily: '"Segoe UI", system-ui, sans-serif'
    fontSize: "1.35rem"
    fontWeight: 650
    lineHeight: 1.3
    letterSpacing: "-.025em"
  body:
    fontFamily: '"Segoe UI", system-ui, sans-serif'
    fontSize: "16px"
    lineHeight: 1.5
  reading:
    fontFamily: 'Georgia, "Times New Roman", serif'
    fontSize: "1.35rem"
    lineHeight: 2
  label:
    fontFamily: '"Segoe UI", system-ui, sans-serif'
    fontSize: ".875rem"
    fontWeight: 600
rounded:
  cover: "3px"
  badge: "4px"
  save-status: "6px"
  control: "8px"
  panel: "12px"
  dialog: "14px"
  feature: "16px"
spacing:
  compact: "8px"
  control-gap: "9px"
  row: "12px"
  base: "16px"
  stack: "20px"
  section: "24px"
  grid: "32px"
components:
  feature-panel:
    backgroundColor: "{colors.feature}"
    textColor: "{colors.feature-ink}"
    rounded: "{rounded.feature}"
    padding: "22px"
  nav-selected:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.feature-ink}"
    rounded: "{rounded.control}"
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.white}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
  reader-paper:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "28px 22px"
  field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "11px 12px"
  badge:
    backgroundColor: "{colors.tint}"
    textColor: "{colors.accent}"
    rounded: "{rounded.badge}"
    padding: "4px 8px"
---

# Design System: Reading Room

## Overview

The approved direction is a richer library of forest green, terracotta, honey, and creamy paper. Large filled feature panels and peach supporting surfaces give the interface a warmer, more expressive appearance while keeping reading comfortable.

Kids, Teens, and Adults share the same functionality and layout. Kids use warm ochre and brown; Teens use warm plum; Adults use the default green palette. This document records the implemented CSS, including its final responsive overrides.

## Colors

The frontmatter owns exact palette values. `paper` is the page background, `surface` is the light control and reading surface, `ink` is primary text, and `muted` carries supporting information. `accent` drives primary actions and selection; `tint` provides quiet emphasis; `line` separates content; `warm` marks the short reader rule.

Audience themes replace paper, accent, hover, ink, muted, tint, line, and warm through `body[data-theme]`. Feature backgrounds, feature supporting text, and peach also change by audience. Surface, feature ink, honey, error, and focus remain shared. Errors use text and context as well as color.

Feature panels use `feature` with cream `feature-ink`, warm `feature-muted`, and a honey greeting. Peach fills the aside, continuation, empty state, profile heading, and count badge. Terracotta `warm` marks the reader rule. Selected navigation uses a filled accent background with feature ink.

## Typography

Use Segoe UI with system sans fallbacks for the interface and Georgia with Times New Roman fallback for story text. Ordinary paragraphs have a 70ch maximum; story text has a 40ch maximum and double line spacing.

The library introduction is 1.875rem below 600px, 2.5rem from 600px, and 2.75rem from 960px (the final mobile override also applies below 360px). General h1 uses the headline token. Reading titles are Georgia, weight 400, 2rem on mobile and 2.5rem from 600px. Story text increases to 1.6rem from 600px; introductory story text stays 1.25rem. Keep authored book text independent of UI translations.

The intentional supporting type ramp includes: section headings 1.5rem; desktop aside and empty-state headings 1.75rem; book titles 1.125rem; activity legends 1.0625rem; labels, sample notes, counts, and stat captions .875rem; book metadata and collection actions .8125rem; badges .75rem. Navigation labels are .75rem on mobile, .875rem from 600px, and .6875rem below 360px. These role-specific sizes complement the 1rem body rather than forming a single strict mathematical scale.

## Layout

The main container is centered at 1120px maximum width with mobile padding `30px 20px 130px`. At 600px it uses `40px 36px 140px`; at 960px its top padding becomes 30px. Expanded reader navigation increases bottom clearance to 250px. Below 360px horizontal main padding becomes 14px.

The book grid has two columns on mobile, three from 600px, and two within the desktop library main column from 960px. Desktop adds a 260px aside across a 44px gap. The aside is hidden below 960px. Detail pages become two columns from 600px. Reading stays within 800px on desktop, with paper padding `42px 48px` from 600px and `48px 64px` from 960px.

Navigation stays fixed to the bottom at every width and respects the bottom safe-area inset. Its three links use stacked icons and labels on mobile and horizontal arrangements from 600px.

The narrow phone header keeps offline readiness visible as a small text line below the brand. Image pages preserve intrinsic proportions; image-and-text layouts become two columns from 600px, with a 24px gap. Native audio controls fill the available width.

The feature panel uses 22px padding on phones, 32px 36px from 600px, and 36px 40px from 960px. Desktop covers and their copy are capped at 280px. Filter controls sit on a light 12px panel; the aside uses 26px padding. Profile headings and empty states use peach 12px panels.

## Elevation & Depth

Most surfaces use tonal separation and fine borders. Paper and the reader handle use `0 12px 32px #573a1712`; covers use `3px 7px 15px #213d321f`; dialogs use `0 24px 80px #142d3340` with a `#17372b66` backdrop. Reserve these treatments for their existing roles.

## Shapes

Controls use 8px corners, reading and continuation panels 12px, and dialogs 14px. Cover images use almost-square 3px corners within 5px clipped buttons; feature and welcome panels use 16px corners. Covers retain a 3:4 aspect ratio. Avatars are circular. Library cards are open compositions rather than individually boxed panels.

## Components

Profile avatars use nine original gouache character portraits, from children to older adults. The picker is a three-column grid with 12px gaps, 12px option corners, and 72px circular portraits (64px and 8px gaps below 360px). Each option has a name and localized screen-reader description. Selection uses an accent border, tinted background, and checkmark; keyboard focus remains visible. Any profile may choose any portrait. Header, navigation, profile, and switcher reuse the selected image; uploaded photos remain supported.

Buttons have a 44px minimum height, 600 weight, and 9px content gap. Primary hover deepens the accent; ordinary hover uses tint. Disabled controls have .45 opacity. Keyboard focus uses a 3px amber outline offset by 4px. Fields have a 1px `line` border and 46px minimum height.

Book cards pair a cover with title, compact metadata, sample badge, and collection action. Cover hover scales to 1.025 over .2s. Answer options use bordered rows with 8px corners, at least 48px tall, and show checked state with tint, an accent border, and a 1px inset accent stroke. Options have 14px padding.

The reader dock starts collapsed: main links and page index are hidden while save status and the navigation handle share one centered flex row with an 8px gap at every width. Both have zero margin; status uses automatic width capped at 45% so it cannot overlap the handle. Expanding the dock places status above the handle and reveals horizontal 44px page buttons and the main links; activity pages have a small dot. The handle supports click and vertical swipe. Page controls remain below the paper.

Page animations offer a .22s horizontal fade or .42s perspective turn using `cubic-bezier(.16,1,.3,1)`. Reduced-motion preference disables animations, transitions, and smooth scrolling.

The reader rule is 56px by 3px with 2px corners. Navigation uses filled selected states and larger labels; the collapsed reader handle now has a 44px minimum height and accent-colored border. Keep the existing collapsed dock row and its non-overlapping save status arrangement.

## Do's and Don'ts

- **Do** preserve the cream library character and the three audience palettes.
- **Do** use serif text for comfortable reading and system sans for controls.
- **Do** reserve space for fixed navigation and keep collapsed save feedback alongside its handle with an 8px gap and 45% maximum width.
- **Do** preserve keyboard focus and reduced-motion behavior.
- **Don't** replace the bottom navigation with a desktop-only navigation pattern.
- **Don't** box every book into a raised card or let decoration compete with reading.


