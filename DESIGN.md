---
name: Reading Room
description: A warm, quiet library for independent reading practice.
colors:
  paper: "#f7f5ef"
  surface: "#fffefb"
  ink: "#243b34"
  muted: "#5e6c63"
  accent: "#254e43"
  accent-hover: "#193a31"
  tint: "#e7ede3"
  line: "#d8ddd1"
  warm: "#a44632"
  error: "#9e3025"
  focus: "#b97428"
  white: "#fff"
  kids-paper: "#fcf6e8"
  kids-accent: "#854629"
  kids-accent-hover: "#66331d"
  kids-ink: "#45382b"
  kids-muted: "#76634f"
  kids-tint: "#f6e7c8"
  kids-line: "#e6d6b9"
  kids-warm: "#a35725"
  teens-paper: "#f4f3f8"
  teens-accent: "#4c4675"
  teens-accent-hover: "#373156"
  teens-ink: "#302c44"
  teens-muted: "#68637a"
  teens-tint: "#e9e5f3"
  teens-line: "#dcd7e7"
  teens-warm: "#79609a"
typography:
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
spacing:
  compact: "8px"
  control-gap: "9px"
  row: "12px"
  base: "16px"
  stack: "20px"
  section: "24px"
  grid: "32px"
components:
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
    padding: "3px 8px"
---

# Design System: Reading Room

## Overview

The approved direction is a warm cream and deep-green library: quiet, approachable, and comfortable for sustained reading. Book covers supply illustration; the surrounding interface uses restrained rules, generous space, and familiar controls.

Kids, Teens, and Adults share the same functionality and layout. Kids use warm ochre and brown; Teens use muted violet; Adults use the default green palette. This document records the implemented CSS, including its final responsive overrides.

## Colors

The frontmatter owns exact palette values. `paper` is the page background, `surface` is the light control and reading surface, `ink` is primary text, and `muted` carries supporting information. `accent` drives primary actions and selection; `tint` provides quiet emphasis; `line` separates content; `warm` marks the short reader rule.

Audience themes replace paper, accent, hover, ink, muted, tint, line, and warm through `body[data-theme]`. Surface, error, and focus remain shared. Errors use text and context as well as color.

## Typography

Use Segoe UI with system sans fallbacks for the interface and Georgia with Times New Roman fallback for story text. Ordinary paragraphs have a 70ch maximum; story text has a 40ch maximum and double line spacing.

The library introduction is 2.1rem below 600px, 3.25rem from 600px, and 2.75rem from 960px. General h1 uses the headline token. Reading titles are Georgia, weight 400, 2rem on mobile and 2.5rem from 600px. Story text increases to 1.6rem from 600px; introductory story text stays 1.25rem. Keep authored book text independent of UI translations.

## Layout

The main container is centered at 1120px maximum width with mobile padding `30px 20px 130px`. At 600px it uses `40px 36px 140px`; at 960px its top padding becomes 30px. Expanded reader navigation increases bottom clearance to 250px. Below 360px horizontal main padding becomes 14px.

The book grid has two columns on mobile, three from 600px, and two within the desktop library main column from 960px. Desktop adds a 270px aside across a 56px gap. The aside is hidden below 960px. Detail pages become two columns from 600px. Reading stays within 800px on desktop, with paper padding `42px 48px` from 600px and `48px 64px` from 960px.

Navigation stays fixed to the bottom at every width and respects the bottom safe-area inset. Its three links use stacked icons and labels on mobile and horizontal arrangements from 600px.

The narrow phone header keeps offline readiness visible as a small text line below the brand. Image pages preserve intrinsic proportions; image-and-text layouts become two columns from 600px, with a 24px gap. Native audio controls fill the available width.

## Elevation & Depth

Most surfaces use tonal separation and fine borders. Paper and the reader handle use `0 12px 36px #233c3315`; covers use `3px 7px 15px #213d321f`; dialogs use `0 24px 80px #142d3340` with a `#17372b66` backdrop. Reserve these treatments for their existing roles.

## Shapes

Controls use 8px corners, reading and continuation panels 12px, and dialogs 14px. Covers use almost-square 3px corners and a 3:4 aspect ratio. Avatars are circular. Library cards are open compositions rather than individually boxed panels.

## Components

Buttons have a 44px minimum height, 600 weight, and 9px content gap. Primary hover deepens the accent; ordinary hover uses tint. Disabled controls have .45 opacity. Keyboard focus uses a 3px amber outline offset by 4px. Fields have a 1px `#aeb9ab` border and 46px minimum height.

Book cards pair a cover with title, compact metadata, sample badge, and collection action. Cover hover scales to 1.025 over .2s. Answer options use bordered 8px rows, at least 48px tall, and show checked state with tint and an accent border.

The reader dock starts collapsed: main links and page index are hidden while save status and the navigation handle share one centered flex row with an 8px gap at every width. Both have zero margin; status uses automatic width capped at 45% so it cannot overlap the handle. Expanding the dock places status above the handle and reveals horizontal 44px page buttons and the main links; activity pages have a small dot. The handle supports click and vertical swipe. Page controls remain below the paper.

Page animations offer a .22s horizontal fade or .42s perspective turn using `cubic-bezier(.16,1,.3,1)`. Reduced-motion preference disables animations, transitions, and smooth scrolling.

## Do's and Don'ts

- **Do** preserve the cream library character and the three audience palettes.
- **Do** use serif text for comfortable reading and system sans for controls.
- **Do** reserve space for fixed navigation and keep collapsed save feedback alongside its handle with an 8px gap and 45% maximum width.
- **Do** preserve keyboard focus and reduced-motion behavior.
- **Don't** replace the bottom navigation with a desktop-only navigation pattern.
- **Don't** box every book into a raised card or let decoration compete with reading.
