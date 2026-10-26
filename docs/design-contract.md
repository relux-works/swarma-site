# Swarma site: design contract

This contract fixes how the Swarma site looks and behaves before any page is built. It applies the
Relux Works product web design system to Swarma. Every page, component and check in this repository
follows it; a deviation is recorded here before it ships.

How to read this file:

- Anchors in parentheses point to the Swarma book, Russian edition: chapter number, chapter title
  where needed, and section title, for example (ch. 02 «Имена и участники»). Among the book's
  editions the Russian one is the source of truth; where the book and the module specifications
  differ, the specifications prevail (ch. 00, title page notes).
- Items marked **PROPOSAL (awaiting owner approval)** are design choices the owner has not approved.
  They may be implemented so the site can be built and reviewed, but they are not final.
- Items marked **PENDING DECISION** need an owner decision before they may appear on the public
  site. Pages are designed to work without them.
- This file states no development status for any part of Swarma. Status reaches the site only
  through the status data described in section 7, and only in the words of ch. 29.

## 1. Product promise

The site explains Swarma, a platform for swarms of AI agents that ranges from several agents on one
owner's machine to joint work of independent participants in an open network (ch. 00 «Для кого эта
книга», opening; book subtitle), to an engineer who wants to know how it is built and what each
guarantee rests on (ch. 00 «Читатель»; ch. 00 «Для кого эта книга», opening). It presents the three
layers, the roles and the cross-cutting principles (ch. 02, opening and «Имена и участники»; ch. 03,
opening), shows the state of each part only as ch. 29 states it, and leads the reader to the book
and the papers.

The site describes architecture, not installation. Installation and commands belong to the module
documentation (ch. 00 «Для кого эта книга», second paragraph). The site runs no part of the
platform and offers nothing to join or install.

## 2. Page archetypes

The site is documentation and editorial content about an architecture. It is not a product landing,
and it has no marketing hero: Swarma has no product interface a visitor can use from the site.

| Route (under `/ru/`, later `/en/`) | Dominant archetype | First-viewport signal | Primary evidence |
| --- | --- | --- | --- |
| `/` (locale home) | Editorial publication | Product name, literal category, reading path into the book | Book entry, status excerpt, chapter references |
| `/platform/` | Documentation | Page title, design frame line, the three layers, section index | Chapter references; book diagram in private builds only |
| `/platform/runtime/` | Documentation | Page title, lead, design frame line, section index | Chapter references, limits callouts, status rows |
| `/platform/protocol/` | Documentation | Page title, lead, design frame line, section index | Chapter references, limits callouts, status rows |
| `/platform/chain/` | Documentation | Page title, lead, design frame line, section index | Chapter references, limits callouts, status rows |
| `/principles/` | Documentation | Page title, design frame line, list of the seven principles | Per-layer mechanism for each principle |
| `/werkstatt/` | Documentation | Page title, design frame line, the definition of a workbench | Chapter references, status row |
| `/status/` | Documentation (data reference) | Page title, book version and date, start of the layer map | The layer map table rendered from data |
| `/book/` | Editorial publication | Book entry: title, authors, version, date | Book metadata, map of the five parts |
| `/papers/` | Editorial publication | List of paper entries | Paper metadata |

Density: editorial for prose pages, standard for the home page, compact for status tables.

The design pages are `/platform/`, the three layer pages, `/principles/` and `/werkstatt/`. They
describe Swarma by its design and carry the design frame line (8.4). M1 has no site search; this is a
recorded deviation from the documentation archetype (section 12).

## 3. Primary experience

### Home page, first viewport

At 390 px and at 1440 px the first viewport shows, in this order:

1. The header (section 8.1).
2. The page title block: the name «Swarma» as the product statement (`h1`), the literal category
   from the book subtitle, platform for swarms of AI agents from one machine to an open network
   (ch. 00, title page), and one short paragraph naming the three layers (ch. 00 «Три слоя Swarma»).
3. One primary action, a link to `/book/`, and one secondary link to `/status/`.
4. The top edge of the next section, so the page does not read as an isolated poster.

No image, illustration, animation or statistic appears in the first viewport. The early-access
action is added only when the sign-up exists; until then no action points to it.

### Platform page, first viewport

On `/platform/` and each layer page the first viewport shows the header, the page title block with a
lead paragraph, the design frame line (8.4), the version context line (book version and date, from
the book metadata), and a section index (on-page navigation). On `/platform/` the three layers with one line each are visible
without scrolling at 1440 px (ch. 02 «Имена и участники»). At 390 px the section index collapses to a
native `details` disclosure placed after the lead.

## 4. Family invariants

Taken unchanged from the Relux Works product web design system:

- **Typography.** Inter Tight for display (page and section headings, the text wordmark), Inter for
  body, navigation and data, Roboto Mono for technical labels, chapter references, status words and
  code. `letter-spacing: 0` everywhere, `font-synthesis: none`, `font-optical-sizing: auto`. The
  fixed responsive type scale of the system; no font size tied to viewport width. Reading measure at
  most `45rem`.
- **Fonts as assets.** All three families are self-hosted from open-licence sources with Latin and
  Cyrillic subsets: Inter Tight 600 and 700, Inter 400, 500 and 600, Roboto Mono 400 and 600. No
  third-party font service. The code task records the exact package source and versions.
- **Semantic tokens.** Components consume role tokens only (`--color-text`, `--color-surface`,
  `--color-border`, `--color-accent`, `--color-link`, `--color-focus` and the rest of the baseline
  token contract). Literal colours live only in the theme token layer.
- **Fixed identity colours.** `--color-brand-red: #F60D10`, `--color-brand-ink: #181A18`,
  `--color-brand-white: #FFFFFF` stay outside the product override boundary and are used only by
  the Relux Works artwork.
- **Grid and geometry.** `--layout-max: 73.75rem`, `--layout-reading: 45rem`, `--layout-gutter:
  1.5rem`, the shared spacing scale, full-width bands with a constrained inner grid, `minmax(0, 1fr)`
  tracks, `min-width: 0` on text-bearing children, logical properties throughout. Radii 4 px for
  controls and 8 px for surfaces; nothing larger. Cards only for repeated independent objects; no
  nested cards.
- **Themes.** Light, dark, light increased contrast, dark increased contrast, reduced transparency
  and forced colours, all from system preferences. `color-scheme: light dark`. No manual theme
  switch in M1.
- **Accessibility.** WCAG 2.2 Level AA as the release minimum, plus the stricter family rules:
  44 × 44 px targets, visible focus in every appearance, reduced-motion equivalents.
- **Writing.** Calm, direct, technically accurate copy; every claim maps to a book chapter or a
  paper. In Russian interface copy no guillemets and no long dashes. Names exactly as in ch. 02
  «Имена и участники»: Swarma, Swarma Runtime, Swarma Protocol, Swarma Chain, Swarma Keeper,
  Swarma Curator, Swarma Keyholder. The signer is unbranded: «подписант», "signer".

## 5. Operator relationship

Relux Works operates the site. The book's title page carries the brand line «Relux Works · Swarma»
(ch. 00, title page). Swarma stays the primary identity on every page.

- **Header:** Swarma only. The inline-start zone holds the Swarma text wordmark (section 6.6). The
  Relux Works lockup does not appear in the header, so the operator never reads louder than the
  product.
- **Footer:** the approved horizontal Relux Works lockup, copied unchanged from the design system's
  approved artwork: the ink lockup on light surfaces, the dark (white wordmark) lockup on dark
  surfaces, the one-colour lockup with the sanctioned `CanvasText` path-fill override under forced
  colours. Rendered at 168 CSS px wide, never below 160 px, with at least one red-arm thickness
  (14.14 % of the artwork height) of clear space. It is a link to the public Relux Works site with
  the accessible name `Relux Works`; the nested SVG is `aria-hidden="true"`. LTR-isolated
  (`direction: ltr; unicode-bidi: isolate`), never mirrored, never animated.
- **Relationship text:** one line next to the lockup naming Swarma and its relation to Relux Works,
  with the wording taken from the book's title page line. The legal line (copyright holder, year) is
  **PENDING DECISION**.
- **Favicon:** **PROPOSAL (awaiting owner approval).** Swarma has no approved mark, so the site uses
  the approved light and dark Relux Works symbols as media-qualified SVG favicons, with the `.ico`
  and Apple touch fallbacks generated from the approved light avatar. The alternative is no
  favicon until Swarma has an approved mark.
- **Structured data:** `Organization` is Relux Works with `logo` set to the approved standalone
  symbol. No product logo is declared for Swarma.
- **Never:** a redrawn, retyped, recoloured, traced or image-generated Relux mark; the Relux
  wordmark as live text; a Swarma mark merged with or placed inside the Relux lockup.

## 6. Expression slots

Swarma has no approved accent, logo or media. Every slot below is chosen conservatively, and only one
identity signal carries weight: the accent. The page structure, the chapter references and the
status data do the rest.

### 6.1 Accent: **PROPOSAL (awaiting owner approval)**

A deep blue, in the "developer infrastructure" direction of the family colour rules. It separates
Swarma from the Relux Works operator red and stays clear of the success (green) and warning (amber)
roles. It is defined as a complete set for all four appearances; hover, link, focus and soft values
are chosen per appearance, not derived by a percentage function.

| Token | Light | Dark | Light, more contrast | Dark, more contrast |
| --- | --- | --- | --- | --- |
| `--color-accent` | `#2347B0` | `#8AA8FF` | `#172F80` | `#B3C6FF` |
| `--color-accent-hover` / `-pressed` | `#1C3A94` | `#A3BBFF` | `#0F2266` | `#C7D5FF` |
| `--color-link` | `#1C3A94` | `#A3BBFF` | `#172F80` | `#BCCDFF` |
| `--color-link-hover` | `#142C75` | `#BCCDFF` | `#0F2266` | `#D1DCFF` |
| `--color-focus` | `#2347B0` | `#A3BBFF` | `#172F80` | `#BCCDFF` |
| `--color-on-accent` | `#F7F9F7` | `#151815` | `#F7F9F7` | `#111411` |
| `--color-accent-soft` | `rgba(35, 71, 176, 0.09)` | `rgba(138, 168, 255, 0.15)` | `rgba(23, 47, 128, 0.14)` | `rgba(179, 198, 255, 0.20)` |
| `--color-selection-bg` | `#D6DEF3` | `#2B3A68` | `#C9D4F2` | `#2B3A68` |

Forced colours map accent and link to `LinkText` and focus to `Highlight`, as the baseline does.

Contrast evidence. WCAG 2.x relative-luminance ratio, computed by the script in Appendix A (the
command is given there) from the hex values against the baseline Relux surface tokens of the same
appearance (`bg`, `surface-subtle`, `surface`, and
`surface-hover` in light themes or `surface-raised` in dark themes). Each cell gives the lowest and
highest ratio across those surfaces.

| Pair | Light | Dark | Light, more contrast | Dark, more contrast | Target |
| --- | ---: | ---: | ---: | ---: | --- |
| accent on surfaces | 6.83–7.79 | 6.29–8.06 | 9.46–11.54 | 8.57–11.25 | 4.5:1; 7:1 in more contrast |
| accent hover on surfaces | 8.53–9.72 | 7.66–9.81 | 11.53–14.05 | 9.92–13.02 | 4.5:1; 7:1 in more contrast |
| link on surfaces | 8.53–9.72 | 7.66–9.81 | 9.46–11.54 | 9.18–12.05 | 4.5:1; 7:1 in more contrast |
| link hover on surfaces | 10.78–12.29 | 9.18–11.76 | 11.53–14.05 | 10.61–13.93 | 4.5:1; 7:1 in more contrast |
| focus on surfaces (non-text) | 6.83–7.79 | 7.66–9.81 | 9.46–11.54 | 9.18–12.05 | 3:1 |
| on-accent on accent | 7.63 | 7.78 | 11.31 | 10.99 | 4.5:1; 7:1 in more contrast |
| on-accent on accent hover | 9.53 | 9.47 | 13.77 | 12.71 | 4.5:1; 7:1 in more contrast |
| body text on accent-soft over `bg` | 13.99 | 11.97 | 13.35 | 11.02 | 4.5:1; 7:1 in more contrast |
| accent on accent-soft over `bg` | 6.46 | 6.26 | 8.54 | 7.30 | 4.5:1; 7:1 in more contrast |
| selection text on selection bg | 13.00 | 9.85 | 12.63 | 9.85 | 4.5:1 |
| link against body text | 1.74 | 1.57 | 1.56 | 1.41 | not a pass: see below |

Consequences recorded with the evidence:

- Link colour alone does not separate a link from body text (ratio below 3:1 against the text
  colour). Links inside prose are therefore always underlined; colour is an additional cue only.
- The accent and the information role (`--color-info`) are close in luminance (1.15:1 light,
  1.34:1 dark, 1.34:1 light more contrast, 1.12:1 dark more contrast) and differ only in hue. The
  information role always carries a text label, so the two are never told apart by colour alone.
  This closeness is a recorded deviation (section 12).
- The ratios are computed values. The release gate re-measures the shipped tokens in a browser and
  records foreground token, background token, appearance, ratio and tool.

### 6.2 Neutral tint: **PROPOSAL (awaiting owner approval)**

The baseline Relux neutral family, unchanged, in all four appearances. Keeping the neutrals fixed
leaves one identity signal (the accent), reuses neutrals the family has already validated, and
keeps the operator lockup on its tested surfaces. Measured on the same surfaces:

| Text token | Light | Dark | Light, more contrast | Dark, more contrast |
| --- | ---: | ---: | ---: | ---: |
| `--color-text` | 14.80–16.87 | 12.02–15.40 | 14.79–18.03 | 12.95–17.00 |
| `--color-text-muted` | 6.51–7.42 | 8.09–10.37 | 9.79–11.94 | 9.86–12.95 |
| `--color-text-faint` | 4.72–5.38 | 5.67–7.27 | 7.37–8.98 | 8.06–10.59 |
| `--color-border-strong` (non-text) | 3.40–3.88 | 3.41–4.37 | 4.95–6.03 | 4.60–6.04 |

`--color-text-faint` is used only for compact metadata, never for body text, chapter references or
status words.

### 6.3 Supporting colour

None. The status vocabulary is not colour-coded (section 8.6).

### 6.4 Media

Swarma has no approved media. The only proposed media source is the book's own diagrams (section 7,
item 4). Publishing them on the public site is **PENDING DECISION**; until then they appear only in
private builds, behind the build switch. Public builds contain no images. No stock imagery, no
illustrations, no generated imagery, no abstract network or particle graphics, in any build.

### 6.5 Iconography

Icons only where a familiar symbol is clearer than text: menu, close, external link. One open icon
library, chosen in the code task. Every icon-only control has an accessible name. No product icon or
symbol exists for Swarma and none is drawn.

### 6.6 Wordmark: **PROPOSAL (awaiting owner approval)**

The text «Swarma» set in Inter Tight 700, `letter-spacing: 0`, always in Latin script in both
locales, LTR-isolated, in `--color-text` (`CanvasText` in forced colours). In the header it is the
link to the locale home with the accessible name «Swarma». It is live text, not artwork, and it is
not a logo: no symbol, no container, no colour treatment, no ligature or custom kerning. When Swarma
gets an approved mark, the mark replaces this text and this item is closed.

### 6.7 Density

Editorial for prose pages, standard for the home page, compact for tables. The spacing scale and
alignment contract stay shared.

### 6.8 Motion

The site has no domain motion: it shows no live state. Motion is limited to the mobile navigation
drawer (base timing, transform and opacity, no bounce, interruptible) and press feedback on
controls. Nothing moves on scroll, nothing loops, nothing animates on entry. Under reduced motion the
drawer appears with a short opacity change only.

## 7. Proof

What makes the site credible is the material it points to, not decoration.

1. **Status table.** The layer map from ch. 29 («Карта по слоям»), rendered from a copy of that
   table kept in the repository and tagged with the book version it came from. Its four columns are
   the chapter's own: layer and capability, works today, what is not there yet, chapter
   (ch. 29 «Карта по слоям»). The part tables (ch. 29 «Состояние по частям платформы») come from
   the same copy. Status reaches a page only through the status component, called by key, and a
   status lint keeps readiness phrases out of prose (8.6).
2. **The book and the papers.** Entries with title, authors, version, date and abstract, taken from
   the release metadata. The book's own metadata gives its title, subtitle, authors, version and
   date (ch. 00, title page). Links to the PDFs are placeholders in M1; publishing the PDFs is
   **PENDING DECISION**.
3. **Chapter references.** Every content section names the book chapter and section it draws on,
   visibly (section 8.4). A reader can check any statement against the book.
4. **Diagrams from the book.** Proposed media source: the book's own diagrams, for example the
   three-layer diagram (ch. 02, opening), the protocol topology (ch. 17 «Три плоскости работы») and
   the Swarma Chain sublayers (ch. 26 «Три подслоя с разными обязательствами»). Publishing them on
   the public site is **PENDING DECISION**. Until the owner decides, they appear only in private
   builds, behind a build switch:
   - **Switch.** The environment variable `SWARMA_BOOK_FIGURES`. Off by default; on only when set
     to `1`. Every public build runs with it off, and the public build pipeline never sets it.
   - **Placement.** A page places a figure with a marker on a line of its own:
     `[[figure <name>]]`, where `<name>` is the figure's file name in the book without its extension,
     for example `[[figure three-layers]]`. The marker is the only way a book figure enters a page.
   - **Switch on (private builds only).** The book 1.6 diagram renders unchanged: the same SVG, not
     recoloured, cropped or redrawn. It sits in a figure with the book's caption and a source line
     in the form decided for the site: «Источник: книга Swarma, версия 1.6, глава NN, рисунок «…»»,
     where NN is the chapter that holds the figure and the quoted title is the book's caption for it
     (component 8.11). This source line is the one place where Russian interface copy uses
     guillemets, because it quotes a book title.
   - **Switch off (every public build).** The marker renders nothing: no empty frame, no placeholder
     text, no reserved space. Every page is complete without its figures: what a figure shows
     already exists as text or a table in the same section.
   - **Source files.** The figure files are not committed to this repository, which is meant to
     become public. A private build reads them from a copy of the book 1.6 release outside the
     repository; the code task defines how that location is given.
   - **Build checks.** A marker that names a figure the book release does not contain fails a
     private build. A public build fails if its output contains a book figure or an unresolved
     marker.
5. **Command excerpts: not in M1.** Commands that the book shows are not shown on M1 pages. Code on
   a page reads as something a visitor can run today, which is a status statement, and the site makes
   status statements only through the status data. Recorded as an open item for a later milestone.

No statistics, percentages of readiness, user counts, testimonials or logos of third parties. The
book states that the states of the parts do not add up to one readiness percentage (ch. 29, opening),
so the site never aggregates status rows into a number, a progress bar or a summary sentence.

## 8. Components

Each component lists its purpose, states, keyboard and screen-reader behaviour, and tokens. Tokens
are semantic roles; "type" refers to the shared type roles and scale.

### 8.1 Header

- **Purpose:** identify Swarma, reach the main routes, switch language.
- **Structure:** three stable zones on the shared header grid (`minmax(0, 13.75rem) minmax(0, 1fr)
  minmax(0, 13.75rem)`), height `--layout-header-height`. Inline start: the text wordmark (6.6).
  Centre: primary navigation (`nav` with an accessible name) to Platform, Principles, Werkstatt,
  Status, Book, Papers. Inline end: the language switch (8.3). The header is static (not sticky), so
  it never covers a focused element or an anchor target.
- **States:** default, hover, focus-visible, pressed, current page (`aria-current="page"`, shown by
  an underline that does not change the link's box), mobile menu open and closed. Below about
  1100 px, or as soon as translated labels no longer fit, the navigation becomes one menu button
  that opens a modal drawer from the logical inline end.
- **Keyboard and screen reader:** the skip link (8.10) comes first. Navigation links are native
  links in source order. The menu button is a native `button` with an accessible name and
  `aria-expanded`; the drawer is a dialog: focus moves into it on open, stays inside while open,
  returns to the button on close; `Escape`, outside press and route change close it; background
  scroll is locked without shifting page width (`scrollbar-gutter: stable`).
- **Tokens and type:** `--color-bg` (solid, no translucent material), `--color-text`,
  `--color-link-hover` for hover, `--color-focus`, `--color-divider` for the bottom rule,
  `--color-scrim` behind the drawer; Inter compact interface size for links.

### 8.2 Footer

- **Purpose:** provenance and wayfinding, not a second sitemap.
- **Content:** the Swarma name and its relation to Relux Works (section 5) with the approved
  lockup; the book's authors as named on the title page (ch. 00, title page); links to Book, Papers,
  Status; the privacy page and the accessibility statement only when they exist; the language
  switch repeated.
- **States:** default, hover, focus-visible for links.
- **Keyboard and screen reader:** `footer` landmark; link list in reading order; the lockup link has
  one accessible name, `Relux Works`.
- **Tokens and type:** `--color-surface-subtle` band, `--color-text-muted` for secondary text,
  `--color-link`, `--color-focus`, `--color-divider`; Inter compact interface size.

### 8.3 Language switch

- **Purpose:** move to the same route in the other language.
- **Behaviour:** rendered from the list of translations that exist for the current route. A
  counterpart that does not exist is not offered: no dead link and no disabled pseudo-control. In
  M1 only Russian pages exist, so the switch is absent while its header track keeps its width.
- **States:** default, hover, focus-visible, current (`aria-current="true"`).
- **Keyboard and screen reader:** native links; each label in its own language with a matching
  `lang` and `hreflang` (`Русский`, `English`).
- **Tokens and type:** `--color-link`, `--color-text` for the current item, `--color-focus`; Inter
  compact interface size.

### 8.4 Page title block

- **Purpose:** the one `h1` of the page, the lead, the design frame line on design pages, and the
  version context.
- **Content:** title; lead paragraph; on design pages the design frame line; version context line
  with the book version and date from the book metadata; on documentation pages the section index.
- **Design frame line:** on every design page (`/platform/`, `/platform/runtime/`,
  `/platform/protocol/`, `/platform/chain/`, `/principles/`, `/werkstatt/`) one fixed line, the
  same text on every such page within a language. It says that the page describes Swarma by its
  design, as the book does, and that the state of each part is on the status page, with a link to
  `/status/` (ch. 00 «Дизайн и готовность»). It appears once per page, directly after the lead,
  never per paragraph or per section: the page body keeps the book's voice, which describes the
  target design in the present tense, and status stays in one place. It is inside the first
  viewport at 390 and 1440 px. Its text comes from the locale strings, not from page content, so it
  cannot drift between pages, and it contains no status word.
- **States:** static; the frame line's link has hover and focus-visible states.
- **Keyboard and screen reader:** `h1` first in `main`; the frame line is ordinary paragraph text
  with a native link whose text names the status page; the section index is a `nav` with an
  accessible name, a native `details` disclosure below 640 px.
- **Tokens and type:** display type at page-heading size (product-statement size only on the home
  page), lead size, `--color-text`; body size in `--color-text-muted` for the frame line, with an
  underlined `--color-link`; `--color-text-muted` for the version line, Roboto Mono for the version
  string.

### 8.5 Section with chapter reference

- **Purpose:** every content section shows where its content comes from.
- **Content:** section heading (`h2`, or `h3` within a group); body; a visible chapter reference
  above or below the body: chapter number and title, section title, linked to the matching entry on
  `/book/`. One section may cite several chapters.
- **States:** default; link hover and focus.
- **Keyboard and screen reader:** the reference is a normal link whose text names the chapter and
  section; no icon-only reference; headings form a meaningful outline.
- **Tokens and type:** full-width band, `--color-bg` or `--color-surface-subtle` alternating where
  bands need separation; section heading size; Roboto Mono technical size for the reference in
  `--color-text-muted` with `--color-link` for its link.

### 8.6 Status table and status row

- **Purpose:** show the state of Swarma parts exactly as ch. 29 gives it.
- **Data:** rendered only from the repository copy of the ch. 29 tables, tagged with the book
  version. Two shapes:
  - layer map table: layer and capability, works today, what is not there yet, chapter
    (ch. 29 «Карта по слоям»);
  - part rows: part, what it is, status (ch. 29 «Состояние по частям платформы»).
- **Status cell:** the verbatim cell string from the copy, whatever its shape: one vocabulary word,
  a quoted formulation, a quotation followed by a parenthetical, or several quotations. The
  chapter's vocabulary (работает сегодня, решено, спецификация, предложено, открыто) serves only as
  a classification, and only where the cell is exactly one of those words. It never rewrites,
  shortens or normalises a cell (ch. 29 «Состояние по частям платформы»).
- **Names and identifiers in the copy:** the names check and the forbidden-identifier scan run over
  the vendored copy as well as over the site. A row that fails either cannot be embedded, and
  embedding it fails the build. Rows are never silently reworded. One section is excluded from the
  vendored part tables by an explicit exclusion documented in the data file: the ch. 29 section on
  message signatures and the signer, which brands the signer and uses internal code names. The
  exclusion stays until a book edition fixes the signer naming (open item for the lead).
- **How status reaches a page:** only through this component, called by table or row key. Content
  files carry no status text, and a key with no rows fails the build. A status lint rejects
  readiness phrases, in Russian and English, in content files and in the rendered prose of every
  page outside status markup (elements the component marks as status). Its phrase list and its
  allow-list live in the repository; every allow-list entry names the file, the exact sentence and
  the reason. Initial phrase list: работает сегодня, уже работает, реализовано, реализован,
  готово к, доступно, в разработке, запущено, выпущено, бета; works today, already works,
  implemented, available now, ready to use, in development, released, live, beta, coming soon,
  production-ready. Vocabulary words that are common prose (нет, открыто, решено) are not linted;
  the component rule keeps them out of status positions.
- **Rendering rules:** cell text verbatim, including «нет»; no colour coding, icons, traffic lights,
  progress bars, counts or totals; status cells in Roboto Mono in `--color-text`. A `caption` names
  the source chapter, the book version and its date. On layer pages, a filtered excerpt (rows for
  that layer) links to `/status/`.
- **States:** default; long content; narrow width. Below 640 px the native table sits in a labelled,
  keyboard-focusable scroll region (`role="region"`, `aria-labelledby` the caption, `tabindex="0"`)
  with the first column kept visible; no column is clipped or hidden.
- **Keyboard and screen reader:** native `table`, `caption`, `th scope="col"`, row headers with
  `scope="row"`; the scroll region is reachable and scrollable by keyboard.
- **Tokens and type:** `--color-surface` body, `--color-surface-subtle` header row,
  `--color-border` cell rules, `--color-text`, `--color-focus` for the region focus ring; Inter
  compact interface size for cells.

### 8.7 Callout for a guarantee's limits

- **Purpose:** state what a mechanism does not guarantee, next to the mechanism. The book names the
  limits of each guarantee (ch. 00 «Читатель»), and the site keeps them beside the claim.
- **Content:** a short heading (Limits / Пределы), the limits in the book's terms, the chapter
  reference.
- **States:** static.
- **Keyboard and screen reader:** an `aside` with an accessible name from its heading, placed in
  source order right after the text it qualifies. Not a live region, not collapsible.
- **Tokens and type:** `--color-surface-subtle` background, `border-inline-start` in
  `--color-border-strong`, `--color-text`; not the warning or error roles, because a limit is a
  property of the design, not an alert. Radius 0 on the bordered side, at most 8 px elsewhere.

### 8.8 Book and paper entry

- **Purpose:** one publication with its metadata.
- **Content:** title, subtitle where present, authors, version, date, language, a short abstract
  from the publication itself, and a link placeholder. No PDF in M1.
- **States:** default; link unavailable (placeholder text, not a link and not a disabled button);
  link available once publishing is decided.
- **Keyboard and screen reader:** `article` with a heading; metadata in a description list; the
  version string LTR-isolated.
- **Tokens and type:** repeated entries may use a card (`--color-surface`, `--color-border`, radius
  8 px); Roboto Mono for version and date; `--color-text-muted` for metadata labels.

### 8.9 Code excerpt: not in M1

Dropped from M1 together with command excerpts (section 7, item 5). Recorded as an open item; when a
later milestone brings it back, it needs its own specification and a design-versus-state rule.

### 8.10 Skip link

- **Purpose:** jump past the header to the main content.
- **Behaviour:** the first focusable element; visually hidden until focused, then visible at the
  inline start; targets `main` (`tabindex="-1"`).
- **Keyboard and screen reader:** native link with the text "Skip to content" or its Russian
  equivalent.
- **Tokens and type:** `--color-strong-action` background, `--color-on-strong-action` text,
  `--color-focus` outline; Inter compact interface size.

### 8.11 Book figure (private builds only)

- **Purpose:** show a book diagram unchanged where the build switch allows it (section 7, item 4).
- **Content:** the book's SVG; a `figcaption` with the book's caption for the figure and the source
  line.
- **States:** switch off: renders nothing. Switch on: the figure, with its dimensions declared from
  the SVG view box before it loads.
- **Keyboard and screen reader:** `figure` with `figcaption`; the image has `alt` equal to the
  book's caption; the section text carries the full description. Not focusable.
- **Tokens and type:** no frame or card; caption in `--color-text-muted` at compact interface size;
  source line in Roboto Mono at technical size. The SVG keeps the book's colours in every
  appearance. Its legibility in dark and forced-colours appearances is a private-build check; an
  unreadable figure is reported, never recoloured.

## 9. Route outlines (M1)

Wireframes in text. Each line names a section and what it shows, with the chapter it draws on. Final
wording is written in the content tasks. Every page ends with the footer; every content section
carries its chapter reference (8.5).

Design pages carry the design frame line (8.4), and their outline items describe the design in the
book's voice. No item invites a visitor to install, run, download or use a part of Swarma, and no
item links to an application, a store page or a command. An item that names a user-facing interface
or device is phrased as design ("as designed"); the frame line carries the state.

### `/ru/` (home)

1. Title block: «Swarma» and the literal category (ch. 00, title page); one paragraph with the three
   layers (ch. 00 «Три слоя Swarma»); action to the book, link to the status page.
2. The problem: the three questions familiar to anyone who has run several coding agents at once:
   who acts, on what grounds, who answers for the result when a session stops (ch. 00 «Для кого эта книга», opening; ch. 01
   «Кто говорит и что ему разрешено», «Ответственность не передаётся отправкой»).
3. The answer in one view: boundaries on one machine joined to boundaries between owners, built on
   existing agent environments rather than a model or harness of its own (ch. 01 «Какой ответ мы
   ищем»).
4. The three layers, one line each, linking to the layer pages (ch. 02 «Имена и участники»).
5. The seven principles by name, linking to `/principles/` (ch. 03, section headings).
6. Status excerpt: rows of the layer map selected by key in the status data, rendered verbatim, with
   a link to `/status/` (ch. 29 «Карта по слоям»).
7. The book: the book entry (8.8) and the reading routes for different readers (ch. 00 «Карта пяти
   частей»).

### `/ru/platform/` (overview)

1. Title block with the design frame line: Swarma as three layers, each answering its own question
   (ch. 02, opening).
2. Layer order: numbered bottom-up, built in the other direction (ch. 02, opening; «Порядок
   постройки»).
3. Names: the platform, the three layers, Swarma Keeper and Swarma Curator, and why the keyholder
   (Swarma Keyholder) is not the keeper (ch. 02 «Имена и участники»).
4. The six roles: owner, operator, agent, project, contributor, donor (ch. 02 «Имена и участники»).
5. One path through the three layers (ch. 02 «Один путь через три слоя»).
6. The characteristic failure at each boundary, as a limits callout (ch. 02 «Один путь через три
   слоя», closing paragraphs).
7. Links to the three layer pages and to the status page.

### `/ru/platform/runtime/`

Each mechanism section shows what it does and its limit, with a limits callout where the chapter
names one.

1. Title block with the design frame line: the swarm on one owner's machines (ch. 02 «Swarma
   Runtime: границы на одной установке»).
2. One OS user per agent and the agent's network (ch. 04 «Почему пользователь ОС», «Машина
   выбирает сеть», «Станция и её гарантии»; limits: «Пределы границы»).
3. Keys and the keyholder (ch. 05 «Мастер-секрет и стабильная личность», «Собеседника
   устанавливает ядро»; limits: ch. 02 «Swarma Runtime: границы на одной установке», on secrets
   the agent can still see).
4. Grants: delegation only narrows, revocation and unknown state (ch. 06 «Делегирование только с
   ослаблением», «Отзыв и неизвестное состояние»).
5. Message path and bridge: the carrier delivers, signature and grant authorise (ch. 02 «Swarma
   Runtime: границы на одной установке»; ch. 07 «Носитель не становится источником полномочий»;
   ch. 08 «Допуск к носителю», «Зачем нужен допуск»).
6. Launch and session host (ch. 08 «Запуск агента и хост сессий», «Матрёшка запуска», «Служба,
   раннер и единственный писатель»).
7. Swarma Keeper: a handover completes with an action (ch. 09 «Передача завершается действием»).
8. Swarma Curator: skills, profiles, overlays (ch. 10 «Скилл, профиль и оверлей»).
9. Credentials and logins (ch. 11 «Брокер: одна подписка, аренды на запуски»).
10. Remote workplace, as designed: a separate OS user on the project machine, while the model works
    on the donor's subscription (ch. 12 «Модель думает у донора, руки у нас»).
11. Task board: integration compares the exact head (ch. 13 «Почему интеграция сравнивает точную
    голову»).
12. Model router: deterministic choice (ch. 14 «Почему выбор детерминирован»).
13. Agent memory (ch. 15 «Назначение»).
14. Operator and interfaces, as designed: the companion phone app shows the exact action and signs
    it with a key in the phone's secure chip once the person confirms presence (ch. 16 «Телефон
    оператора»).
15. Status excerpt: Runtime rows of the layer map, linking to `/status/` (ch. 29 «Карта по слоям»).

### `/ru/platform/protocol/`

1. Title block with the design frame line: one environment, several owners (ch. 17 «Одна среда,
   несколько владельцев»).
2. Three planes: thinking, governance, execution (ch. 17 «Три плоскости работы»; ch. 02 «Swarma
   Protocol: совместная работа независимых владельцев»).
3. What crosses the network (ch. 17 «Что пересекает сеть»).
4. Log, quorum certificate and the trust levels L0 to L2 (ch. 18 «Запись и её совершение», «Три
   уровня доверия»).
5. Task contract: the plan permits, the contract requires; three outcomes (ch. 19 «План разрешает,
   контракт требует», «Профиль свойств и три исхода»).
6. Orchestrator lease, epoch and fencing token (ch. 20 «Аренда, эпоха и fencing-токен»).
7. Candidate, independent review and atomic head advance; the five steps of a change (ch. 20 «Кто
   проверяет кандидата», «Атомарное продвижение головы»; ch. 02 «Swarma Protocol: совместная
   работа независимых владельцев»).
8. External effects, stop with one signature, federation (ch. 22 «Остановка одной подписью»,
   «Федерация проектов»).
9. Limits callout: what the protocol does not guarantee (ch. 23 «Явные пределы обещания»), and where
   a bounded model check ends (ch. 21 «Где заканчивается установленный результат»). Any statement of
   what has been checked appears only through status rows.
10. Status excerpt: Protocol rows of the layer map, linking to `/status/` (ch. 29 «Карта по слоям»).

### `/ru/platform/chain/`

1. Title block with the design frame line: the participant beyond one project (ch. 02 «Swarma
   Chain: участник за пределами проекта»).
2. Three sublayers: chain, p2p memory, social graph, each with its own guarantee (ch. 02 «Swarma
   Chain: участник за пределами проекта»; ch. 26 «Три подслоя с разными обязательствами»).
3. Identity cell (ch. 24 «Ячейка личности»; limits: «Границы»).
4. Attestations and portable reputation (ch. 25 «Что в свидетельстве»; limits: «Чего репутация не
   обещает»).
5. Chain design: where consensus ends, the hash-only cryptographic profile, names (ch. 26 «Где
   заканчивается консенсус», «Криптографический профиль: только хэш-функции», «Имена»).
6. Social layer and network memory: pointer apart from the file, the graph decides what the network
   remembers (ch. 27 «Публикация: указатель отдельно от файла», «Граф решает, что помнит сеть»).
7. Status excerpt: Chain rows of the layer map, linking to `/status/` (ch. 29 «Карта по слоям»).

### `/ru/principles/`

1. Title block with the design frame line: the three layers face different adversaries, so one idea
   needs a different mechanism on each layer (ch. 03, opening).
2. Seven sections, one per principle, in the book's order, each with its purpose and three rows,
   Runtime, Protocol, Chain (ch. 03, the seven sections):
   - «Ключ задаёт личность, агент просит подпись»;
   - «Полномочия только сужаются»;
   - «Журнал хранит истину, сессия модели служит кэшем»;
   - «Суждение моделей остаётся вне консенсуса»;
   - «Одобрение относится к точным версиям»;
   - «Чего нельзя проверить, то не разрешено»;
   - «Человек подписывает своё действие».
   The three rows use a repeated structured-row grid, not cards.
3. Reading the guarantees together, with the outer limits as a limits callout (ch. 03 «Как читать
   гарантии вместе»).

### `/ru/werkstatt/`

1. Title block with the design frame line: a workbench is an agent's permanent workplace,
   project × role × environment
   (ch. 08 «Запуск агента и хост сессий», «Верстак: постоянное рабочее место агента»; ch. 30,
   entry «Верстак, Werkstatt»).
2. What a workbench has: its own managed Swarma Curator home with the role profile, its own clone,
   its own identity on the carrier, a record in the workbench registry on the board (same section).
3. Launch through the session host, as designed: the record describes the launch, and the session
   host starts and stops the session from that record; without the session host a workbench does not
   start. No command text is shown (same section).
4. How tasks arrive: messages in project rooms; the right to a task comes from the board record, not
   from the message text; review independence is checked by identity (same section).
5. Two context modes, «продолжать» and «свежий»; identity, home and memory stay constant (same
   section).
6. Clones in a separate root with no `CLAUDE.md` or `AGENTS.md` above them (same section).
7. How the model router picks a workbench (same section, last paragraph).
8. Status row for the workbench, by key (ch. 29 «Runtime: хост сессий и запуск»).

The page explains the design. It offers no workbench to visitors and no sign-up for one.

### `/ru/status/`

1. Title block: book version and date of the status copy, link to the full chapter in the book entry.
2. How to read: states belong to named capabilities and do not add up to a readiness percentage;
   the meaning of the columns; adjacent rows do not mean tested integration (ch. 29, opening and
   «Карта по слоям»).
3. The layer map table, rendered from data (8.6) (ch. 29 «Карта по слоям»).
4. The status vocabulary and its meaning, rendered from data (ch. 29 «Состояние по частям
   платформы»).
5. A pointer to the open questions in the book (ch. 29 «Нерешённые вопросы»); the questions are not
   restated.

### `/ru/book/`

1. Title block: the book entry (8.8): title, subtitle, authors, version, date (ch. 00, title page).
2. What the book is: architecture, not installation (ch. 00 «Для кого эта книга»). Among the book's
   editions the Russian one is the source of truth, and where the book and the module
   specifications differ, the specifications prevail (ch. 00, title page notes).
3. Design and readiness: the book describes the finished design in the present tense, the state of
   each part is in ch. 29 (ch. 00 «Дизайн и готовность»).
4. Map of the five parts with their main questions (ch. 00 «Карта пяти частей»).
5. Reading routes for the owner of an installation, the runtime engineer, the distributed-systems
   engineer and the reader interested in the chain (ch. 00 «Карта пяти частей»).
6. PDF link placeholder (M1 has no PDF).

### `/ru/papers/`

1. Title block: the papers that accompany the book.
2. One paper entry (8.8) per released paper, metadata and abstract from the paper itself; link
   placeholders in M1.
3. The relation to the book: where a chapter refers to a paper, the paper entry links that chapter
   (for example ch. 29 «Карта по слоям» refers to the protocol paper).

## 10. Validation matrix

The completion gate of the design system applies to every release. Cells name what is checked;
"all M1 routes" means the ten routes in section 9.

| Dimension | Values | Routes and states |
| --- | --- | --- |
| Width | 390, 768, 1440, 1920 CSS px | all M1 routes; header open and closed below the navigation breakpoint |
| Appearance | light, dark, light increased contrast, dark increased contrast | all M1 routes at 390 and 1440 |
| Forced colours | active (Windows High Contrast or emulation for screenshots, real for release) | home, one layer page, status, footer lockup |
| Motion and transparency | reduced motion, reduced transparency | mobile drawer open and close |
| Language | Russian (M1); English (M2), each route against its counterpart | all routes per language; longest real labels in header and footer |
| Script | Cyrillic and Latin, including Latin names inside Russian text | headings, wordmark, status table |
| Direction | LTR only; no RTL locale. Components use logical properties so RTL needs no redesign | not applicable until an RTL locale exists |
| Zoom | 200 % text zoom, 400 % browser zoom, larger default font size | home, status, one layer page |
| Keyboard | full journey: skip link, header, drawer, section index, status scroll region, footer | all M1 routes |
| Interactive states | default, hover, focus-visible, pressed, current page, expanded and collapsed, per component: header links, menu button, drawer, language switch, section index disclosure, design frame link, chapter reference links, footer links, status scroll region, skip link | all M1 routes at 390 and 1440. Loading, success, warning and error are not applicable in M1: no component fetches data, submits a form or reports a result (they arrive with the sign-up) |
| Long and empty content | longest status cell and longest row label in the vendored copy; longest chapter and section title cited in a chapter reference; longest translated navigation label; a status key with no rows (must fail the build, not render an empty table); a page with every figure switched off | status, each layer page, header, footer |
| Drawer reversal | rapid open-close-open on the menu button, by pointer and by keyboard, including during the transition | 390 and 768 px, with and without reduced motion: no jump, no stale overlay, focus back on the button |
| Build mode | public (`SWARMA_BOOK_FIGURES` unset or not `1`): no book figure and no marker text in the output, every page complete; private (`SWARMA_BOOK_FIGURES=1`): each marked figure unchanged, with caption and source line | public mode on all M1 routes; private mode on every route with a marker |
| Screen reader | macOS Safari + VoiceOver; Windows NVDA with Firefox or Chrome; Android Chrome + TalkBack; iOS Safari + VoiceOver for the primary mobile journey | home, one layer page, status, book |

Checks required for each release:

- Repository build and every repository check pass, including i18n completeness, the status lint
  (8.6), the names and forbidden-identifier scan over the site and over the vendored ch. 29 copy,
  and the public-build figure check (section 7, item 4).
- `axe-core` in a real browser after each state is stable; the gate fails on any WCAG A or AA tagged
  violation and on any serious or critical one. No global rule suppression.
- Geometry: root `scrollWidth` at most one pixel wider than `clientWidth`; navigation centre within
  one pixel of the viewport centre at desktop widths; header and control boxes unchanged across
  routes and states; no clipped controls or text overlap.
- Contrast: every token pair in section 6 re-measured from the built CSS in every appearance.
- Identity artwork: footer lockup compared with the approved SVG (viewBox `0 0 450 100`, paths only,
  no live text); light, dark, one-colour and forced-colours variants; minimum size and clear space;
  favicon symbol at 16, 24 and 32 CSS px if the favicon proposal is approved.
- Discovery: visible facts, titles, descriptions, JSON-LD, `llms.txt` and the sitemap agree; draft
  routes are `noindex` and absent from the sitemap; canonical and reciprocal `hreflang` once English
  exists.
- Visual review of full-size screenshots for every width and appearance: the literal subject is
  obvious in the first viewport, the next section is visible, axes are coherent, hierarchy works
  without the accent, dark mode has no glare.
- Accessibility statement: required before the public launch, localized and linked from the footer
  (open item, see the end of this file).

## 11. Rejected patterns

| Pattern | Why it is rejected here |
| --- | --- |
| Marketing hero, large empty hero, split hero cards | The site has no product interface to show; a hero would delay entry into the reading content |
| Gradient orbs, glow fields, bokeh, decorative glass | Common decoration for AI products; it carries no information and the family rules forbid it as structure |
| Swarm, hive or bee imagery, particles, node-graph backdrops | Decoration standing in for the architecture; abstract imagery where real material (the book, the diagrams, the status data) should be shown |
| An invented Swarma logo, symbol or mascot | No approved mark exists; the text wordmark is the only identity element until one is approved |
| Redrawn, retyped, recoloured or animated Relux Works artwork | The operator mark is fixed production artwork |
| Readiness percentages, progress bars, counters, traffic-light status colours | Ch. 29 states that the states do not add up to one readiness percentage; colour would read as a verdict beyond the chapter's words |
| Status in prose or in headings | Status comes only from the ch. 29 data, so it can be checked mechanically |
| Generic claims about security, scale or AI capability | Every claim needs a chapter; the book names the limits of each guarantee |
| Testimonials, user counts, partner logos | Nothing of the kind exists to show |
| One-hue page, pure black or pure white interface colours | Family colour rules; glare and loss of depth in dark mode |
| Font size tied to viewport width, negative letter spacing | Family type rules; multilingual consistency |
| Cards as section wrappers, nested cards, radii above 8 px | Family geometry; cards only for repeated entries such as books and papers |
| Hover-only information, hidden focus, motion without a reduced-motion equivalent | Accessibility baseline |
| `overflow-x: hidden` to hide broken geometry | Geometry must be fixed, not concealed; wide tables use a labelled scroll region |
| Scroll-triggered entrance animations | Motion must communicate state; the site has no live state |
| Third-party fonts, analytics or tracking scripts | Not needed for reading; the family trust rules avoid tracking by default |

## 12. Intentional deviations from the family system

| Deviation | Family rule | Reason |
| --- | --- | --- |
| No site search in M1 | The documentation archetype puts navigation, search and version context in the first screen | M1 has ten routes, each design page has a section index, and the book is the complete reference. Search returns when the English pages or further routes make navigation alone insufficient |
| Accent close to the information role in luminance (1.15:1 light, 1.34:1 dark, 1.34:1 light more contrast, 1.12:1 dark more contrast) | Developer-infrastructure palettes keep status colours functionally distinct from the accent | The accent is kept as proposed. The two roles differ in hue, and the information role always carries a text label, so no state is told apart by colour alone (6.1) |

## Appendix A. Contrast computation

The script that produced every ratio in 6.1 and 6.2. It uses only the Python standard library.
Run it from the repository root:

```sh
awk '/^```python$/{f=1;next} /^```$/{f=0} f' docs/design-contract.md | python3 -
```

```python
# WCAG 2.x contrast ratios for the tables in sections 6.1 and 6.2 of this contract.
# Surfaces and text are the baseline Relux tokens; accent values are the 6.1 proposal.
def rgb(h):
    return tuple(int(h[i:i + 2], 16) / 255 for i in (1, 3, 5))

def lum(c):
    c = [x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c]
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]

def ratio(a, b):
    la, lb = lum(a), lum(b)
    return (max(la, lb) + 0.05) / (min(la, lb) + 0.05)

def over(rgba, bg):
    *c, a = rgba
    return tuple(x / 255 * a + y * (1 - a) for x, y in zip(c, bg))

# Order: light, dark, light more contrast, dark more contrast.
# Surfaces: bg, surface-subtle, surface, then surface-hover (light) or surface-raised (dark).
SURFACES = [["#f4f6f4", "#e9ede9", "#fafbfa", "#eef1ee"], ["#111411", "#171b17", "#1c211c", "#252b25"],
            ["#f4f6f4", "#e5e9e5", "#fafbfa", "#e1e6e1"], ["#0e110e", "#151915", "#1a1f1a", "#252b25"]]
TEXT = ["#181a18", "#e7ebe7", "#101310", "#f0f3f0"]
MUTED = ["#4d554f", "#bbc4bc", "#303630", "#d0d7d0"]
FAINT = ["#626a64", "#9aa59b", "#414941", "#bac4bb"]
BORDER_STRONG = ["#788179", "#727e74", "#59635a", "#89948b"]
INFO = ["#165f80", "#64d2ff", "#0d4f6b", "#8cddff"]
ACCENT = ["#2347b0", "#8aa8ff", "#172f80", "#b3c6ff"]
ACCENT_HOVER = ["#1c3a94", "#a3bbff", "#0f2266", "#c7d5ff"]
LINK = ["#1c3a94", "#a3bbff", "#172f80", "#bccdff"]
LINK_HOVER = ["#142c75", "#bccdff", "#0f2266", "#d1dcff"]
FOCUS = ["#2347b0", "#a3bbff", "#172f80", "#bccdff"]
ON_ACCENT = ["#f7f9f7", "#151815", "#f7f9f7", "#111411"]
SOFT = [(35, 71, 176, 0.09), (138, 168, 255, 0.15), (23, 47, 128, 0.14), (179, 198, 255, 0.20)]
SELECTION_BG = ["#d6def3", "#2b3a68", "#c9d4f2", "#2b3a68"]
SELECTION_TEXT = ["#181a18", "#f0f3f0", "#101310", "#f0f3f0"]

def on_surfaces(tokens):
    cells = []
    for t, surfaces in zip(tokens, SURFACES):
        values = [ratio(rgb(t), rgb(s)) for s in surfaces]
        cells.append(f"{min(values):.2f}–{max(values):.2f}")
    return cells

def pairs(fg, bg):
    return [f"{ratio(rgb(a), rgb(b)):.2f}" for a, b in zip(fg, bg)]

rows = {
    "accent on surfaces": on_surfaces(ACCENT),
    "accent hover on surfaces": on_surfaces(ACCENT_HOVER),
    "link on surfaces": on_surfaces(LINK),
    "link hover on surfaces": on_surfaces(LINK_HOVER),
    "focus on surfaces (non-text)": on_surfaces(FOCUS),
    "on-accent on accent": pairs(ON_ACCENT, ACCENT),
    "on-accent on accent hover": pairs(ON_ACCENT, ACCENT_HOVER),
    "body text on accent-soft over `bg`":
        [f"{ratio(rgb(t), over(s, rgb(b[0]))):.2f}" for t, s, b in zip(TEXT, SOFT, SURFACES)],
    "accent on accent-soft over `bg`":
        [f"{ratio(rgb(a), over(s, rgb(b[0]))):.2f}" for a, s, b in zip(ACCENT, SOFT, SURFACES)],
    "selection text on selection bg": pairs(SELECTION_TEXT, SELECTION_BG),
    "link against body text": pairs(LINK, TEXT),
    "`--color-text`": on_surfaces(TEXT),
    "`--color-text-muted`": on_surfaces(MUTED),
    "`--color-text-faint`": on_surfaces(FAINT),
    "`--color-border-strong` (non-text)": on_surfaces(BORDER_STRONG),
    "accent against info (deviation, section 12)": pairs(ACCENT, INFO),
}
for label, cells in rows.items():
    print(" | ".join([label] + cells))
```

## Open items

- Owner approval of the proposals: accent (6.1), neutral tint (6.2), wordmark (6.6), favicon
  (section 5).
- Owner decisions: publishing the book diagrams on the public site (section 7, item 4), publishing
  the PDFs (8.8), the legal line in the footer (section 5).
- The accessibility statement page and its route are not in the M1 route list; the design system
  requires one before a public release.
- Command excerpts and the code excerpt component (section 7, item 5; 8.9) are out of M1 and wait
  for a later milestone.
- For the lead: the ch. 29 section on message signatures and the signer brands the signer and uses
  internal code names. It is excluded from the vendored part tables (8.6) until a book edition fixes
  the signer naming.
