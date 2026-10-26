# Swarma site: design contract

This contract fixes how the Swarma site looks and behaves before any page is built. It applies the
Swarma Platform Design System, a fork of the Relux Works product web design system whose identity
comes from the Swarma book, to the site. Every page, component and check in this repository follows
it; a deviation is recorded here before it ships.

How to read this file:

- Anchors in parentheses point to the Swarma book, Russian edition: chapter number, chapter title
  where needed, and section title, for example (ch. 02 "Имена и участники"). Among the book's
  editions the Russian one is the source of truth; where the book and the module specifications
  differ, the specifications prevail (ch. 00, title page notes). Russian titles and terms in this
  file are quoted with plain double quotes, as the book cites its chapters.
- Items marked **PROPOSAL (awaiting owner approval)** are design choices the owner has not approved.
  They may be implemented so the site can be built and reviewed, but they are not final.
- Items marked **PENDING DECISION** need an owner decision before they may appear on the public
  site. Pages are designed to work without them.
- This file states no development status for any part of Swarma, and the site states none either.
  The site describes Swarma in its finished design state, in the present tense, as the book does;
  the book's chapter "Где мы и что дальше" carries the development state of each part (ch. 00
  "Дизайн и готовность"). Guarantees and their limits are design and stay.
- The book edition is 1.6.1. Every version reference in this file and on the site names it.
- Chapter numbers are the numbers printed in book 1.6.1. Up to and including "Допуск к носителю"
  (chapter 8, source file `08-00`) the printed number equals the chapter's source file number. From
  "Запуск агента и хост сессий" (chapter 9, source file `08`) on, the printed number is one higher
  than the source file number, so "Где мы и что дальше" is chapter 30. Anchors in this file and
  chapter references on the site use the printed number.
- "The design system" means the Swarma Platform Design System. Its tokens, typography, identity
  rules, diagram bridge and contrast report are the site's source; section 4 states the dependency.

## 1. Product promise

The site explains Swarma, a platform for swarms of AI agents that ranges from several agents on one
owner's machine to joint work of independent participants in an open network (ch. 00 "Для кого эта
книга", opening; book subtitle), to an engineer who wants to know how it is built and what each
guarantee rests on (ch. 00 "Читатель"; ch. 00 "Для кого эта книга", opening). It presents the three
layers, the roles and the cross-cutting principles (ch. 02, opening and "Имена и участники"; ch. 03,
opening), names the limits of each guarantee next to it (ch. 00 "Читатель"), and leads the reader to
the book and the papers. It shows no development status: that stays in the book.

The site describes architecture, not installation. Installation and commands belong to the module
documentation (ch. 00 "Для кого эта книга", second paragraph). The site runs no part of the
platform and offers nothing to join or install.

## 2. Page archetypes

The site is documentation and editorial content about an architecture. It is not a product landing,
and it has no marketing hero: Swarma has no product interface a visitor can use from the site.

| Route (under `/ru/`, later `/en/`) | Dominant archetype | First-viewport signal | Primary evidence |
| --- | --- | --- | --- |
| `/` (locale home) | Editorial publication | Product name, literal category, reading path into the book | Book entry, chapter references |
| `/platform/` | Documentation | Page title, lead, the three layers, section index | Chapter references; book diagram in private builds only |
| `/platform/runtime/` | Documentation | Page title, lead, section index | Chapter references, limits callouts |
| `/platform/protocol/` | Documentation | Page title, lead, section index | Chapter references, limits callouts |
| `/platform/chain/` | Documentation | Page title, lead, section index | Chapter references, limits callouts |
| `/principles/` | Documentation | Page title, list of the seven principles | Per-layer mechanism for each principle |
| `/book/` | Editorial publication | Book entry: title, authors, version, date | Book metadata, map of the five parts |
| `/papers/` | Editorial publication | List of paper entries | Paper metadata |
| `/open-source/` | Open-source project | Page title, introduction, start of the repository list | Repository list with book-term descriptions |
| `/privacy/` | Service page | Page title and the short statement | The statement itself |

Density: editorial for prose pages, standard for the home page, compact for tables.

Every page describes Swarma in its finished design state, in the present tense, as the book does. No
page carries a status, a readiness marker or a "by design" disclaimer (section 11). M1 has no site
search; this is a recorded deviation from the documentation archetype (section 12).

## 3. Primary experience

### Home page, first viewport

At 390 px and at 1440 px the first viewport shows, in this order:

1. The header (section 8.1).
2. The page title block: the name "Swarma" as the product statement (`h1`), the literal category
   from the book subtitle, platform for swarms of AI agents from one machine to an open network
   (ch. 00, title page), and one short paragraph naming the three layers (ch. 00 "Три слоя Swarma").
3. One primary action, a link to `/book/`, and one secondary link to `/open-source/`.
4. The top edge of the next section, so the page does not read as an isolated poster.

No image, illustration, animation or statistic appears in the first viewport. The site has no
registration, sign-up or form of any kind; the publication-surface check denies forms.

### Platform page, first viewport

On `/platform/` and each layer page the first viewport shows the header, the page title block with a
lead paragraph, the version context line (book version and date, from the book metadata), and a
section index (on-page navigation). On `/platform/` the three layers with
one line each are visible without scrolling at 1440 px (ch. 02 "Имена и участники"). At 390 px the
section index collapses to a native `details` disclosure placed after the lead.

## 4. Design system and invariants

The site follows the Swarma Platform Design System. It keeps the Relux Works foundations (geometry,
type scale, semantic tokens, theme states, accessibility, QA) and takes its identity from the book.

**Dependency.** The site takes the system's `assets/tokens.css` as a versioned copy: the copy in this
repository names, in its header comment, the design-system commit it was taken from, and it changes
only by replacing it with a newer copy, never by local edits. The system is in independent review.
Its review outcome gates the use of the copy: until the system's review accepts that commit, the copy
serves building and review only and is not released. Contrast evidence for every token pair is the
system's generated contrast report (`references/contrast-report.md` in the system), recomputed by its
`scripts/check_contrast.py` against the copied file.

Taken from the system:

- **Typography.** PT Sans for display and interface text (page and section headings, navigation,
  tables, captions, the interim wordmark), PT Serif for reading prose (lead and body
  paragraphs), PT Mono for technical text (chapter references, versions, code). Weights
  400 and 700; PT Mono has 400 only, so technical text is never bold. `letter-spacing: 0`
  everywhere, `font-synthesis: none`. The fixed responsive type scale; no font size tied to viewport
  width. Reading measure at most `45rem`.
- **Fonts as assets.** All three families are self-hosted from the OFL-1.1 packages the system's
  typography reference lists, in Latin and Cyrillic subsets. No third-party font service. The code
  task records the exact package versions.
- **Semantic tokens.** Components consume the system's role tokens only (`--color-text`,
  `--color-surface`, `--color-border`, `--color-accent`, `--color-link`, `--color-focus` and the
  rest), including the diagram role layer (`--color-role-*`). The system's status layer
  (`--color-status-*`) stays a general capability of the system; the site uses none of it. Literal
  colours live only in the copied token file.
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
- **Accessibility.** WCAG 2.2 Level AA as the release minimum, plus the stricter rules the design
  system inherits: 44 × 44 px targets, visible focus in every appearance, reduced-motion
  equivalents.
- **Writing.** Calm, direct, technically accurate copy; every claim maps to a book chapter or a
  paper. Russian site copy follows the book's Russian style guide: no guillemets; no dash, long or
  short, as a connector (a hyphen in compound words and numeric ranges stays); plain double quotes
  only for real quotations, chapter titles and conditional readings; the letter ё where it belongs;
  code, commands and file names in backticks. Names exactly as the book gives them: Swarma, Swarma
  Runtime, Swarma Protocol, Swarma Chain, Swarma Keeper, Swarma Curator, Swarma Keyholder (ch. 02
  "Имена и участники") and Swarma Signer (ch. 30 "Runtime: подписи сообщений и Swarma Signer").
  Retired and non-book names are rejected (section 11). Infrastructure products are not named: no
  messaging server such as Matrix, no VPN, hosting, peer-to-peer transport or virtualisation product.
  The text names the role instead, for example "транспорт сообщений" / "message transport", or the
  book's own term "носитель" where the book uses it. Agent environments the reader uses, such as
  Claude Code and Codex, may be named where the book uses them to define a harness. Copy describes
  the finished design in the present tense and carries no status, readiness or "by design" framing
  (section 11).

## 5. Operator relationship

Relux Works operates the site. The book's title page carries the brand line "Relux Works · Swarma"
(ch. 00, title page). Swarma stays the primary identity on every page.

- **Header:** Swarma only. The inline-start zone holds the system's interim text wordmark (6.6). The
  Relux Works lockup does not appear in the header, so the operator never reads louder than the
  product.
- **Footer:** the approved horizontal Relux Works lockup, copied unchanged from the approved artwork
  the design system carries: the ink lockup on light surfaces, the dark (white wordmark) lockup on
  dark surfaces, the one-colour lockup with the sanctioned `CanvasText` path-fill override under
  forced colours. Rendered at 168 CSS px wide, never below 160 px, with at least one red-arm
  thickness (14.14 % of the artwork height) of clear space. It is a link to the public Relux Works
  site with the accessible name `Relux Works`; the nested SVG is `aria-hidden="true"`. LTR-isolated
  (`direction: ltr; unicode-bidi: isolate`), never mirrored, never animated.
- **Relationship text:** one line next to the lockup naming Swarma and its relation to Relux Works,
  with the wording taken from the book's title page line. The legal line (copyright holder, year) is
  **PENDING DECISION**.
- **Favicon:** **PROPOSAL (awaiting owner approval).** The design system leaves the interim favicon
  to the product. Swarma has no approved mark, so the site uses the approved light and dark Relux
  Works symbols as media-qualified SVG favicons, with the `.ico` and Apple touch fallbacks generated
  from the approved light avatar, as the system's "Operator favicon" rule describes. The alternative
  is no favicon until Swarma has an approved mark.
- **Structured data:** `Organization` is Relux Works with `logo` set to the approved standalone
  symbol. No product logo is declared for Swarma.
- **Never:** a redrawn, retyped, recoloured, traced or image-generated Relux mark; the Relux
  wordmark as live text; a Swarma mark merged with or placed inside the Relux lockup.

## 6. Identity and expression

The site's identity is the design system's. The site makes no colour, type or mark choices of its
own; this section records which parts of the system it uses. Earlier proposals for an accent, a
neutral tint and an Inter Tight wordmark are withdrawn.

### 6.1 Accent

The system's accent: the book's deep blue in the light appearance, with the system's derived values
for dark and the two more-contrast appearances (`--color-accent`, `--color-accent-hover`,
`--color-accent-pressed`, `--color-accent-soft`, `--color-on-accent`, `--color-link`,
`--color-link-hover`, `--color-focus`). Links inside prose are always underlined: the system records
that link colour alone has less than 3:1 against body text. Contrast evidence is the system's report.

### 6.2 Neutrals

The system's cool blue-grey neutrals in all four appearances (`--color-bg`, `--color-surface*`,
`--color-text*`, `--color-border*`). `--color-text-faint` is used only for compact metadata, never
for body text or chapter references.

### 6.3 Role colours

- **Status colours:** not used. The site carries no status (section 11); the system keeps its status
  layer as a general capability.
- **Roles:** the site may use the system's diagram role colours (`--color-role-*`) only with the
  meaning they have in the book's diagrams (human, agent, service, store, key, external, alert,
  neutral), only on an element that has that role in the mechanism a section describes, and always
  with the element named in text. Role colours are never used for actions, links, navigation,
  feedback or decoration.

### 6.4 Media

Swarma has no approved media. The only proposed media source is the book's own diagrams (section 7,
item 3). Public publication waits for the docs-side release pipeline; until then they appear only in
private builds, behind the off-by-default build switch. Public builds contain no images. No stock
imagery, no illustrations, no generated imagery, no abstract network or particle graphics, in any
build.

### 6.5 Iconography

Icons only where a familiar symbol is clearer than text: menu, close, external link. One open icon
library, chosen in the code task. Every icon-only control has an accessible name. No product icon or
symbol exists for Swarma and none is drawn.

### 6.6 Wordmark

The system's interim text wordmark: "Swarma" in PT Sans 700, `letter-spacing: 0`, always in Latin
script, LTR-isolated, in `--color-text` (`CanvasText` in forced colours). In the header it is the
link to the locale home with the accessible name "Swarma". It is live text, not a logo. The system's
Swarma mark slot is AWAITING OWNER ARTWORK; when the owner supplies the mark, it replaces the
wordmark as the system describes. Nothing on the site draws a mark.

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

1. **The book and the papers.** Entries with title, authors, version, date and abstract, taken from
   the release metadata. The book's own metadata gives its title, subtitle, authors, version and
   date (ch. 00, title page). Once the docs-side release pipeline exists, each entry links to its
   GitHub release and shows the hashes from the release metadata. Until then entries carry no link
   and no PDF.
2. **Chapter references.** Every content section names the book chapter and section it draws on,
   visibly (section 8.5). A reader can check any statement against the book.
3. **Diagrams from the book.** Proposed media source: the book's own diagrams, for example the
   three-layer diagram (ch. 02, opening), the protocol topology (ch. 18 "Три плоскости работы") and
   the Swarma Chain sublayers (ch. 27 "Три подслоя с разными обязательствами"). Publishing them on
   the public site waits for the docs-side release pipeline, which publishes each book and paper
   build as a GitHub release with its hashes. Until then they appear only in private builds, behind a
   build switch:
   - **Switch.** The environment variable `SWARMA_BOOK_FIGURES`. Off by default; on only when set
     to `1`. Every public build runs with it off, and the public build pipeline never sets it.
   - **Placement.** A page places a figure with a marker on a line of its own:
     `[[figure <name>]]`, where `<name>` is the figure's file name in the book without its extension,
     for example `[[figure three-layers]]`. The marker is the only way a book figure enters a page.
   - **Switch on (private builds only).** The book 1.6.1 diagram renders unchanged: the same SVG, not
     recoloured, cropped or redrawn. It sits in a figure with the book's caption and a source line
     in this form: `Источник: книга Swarma, версия 1.6.1, глава NN, рисунок: <подпись>`, where NN is
     the chapter that holds the figure and `<подпись>` is the book's caption for it, verbatim
     (component 8.11).
   - **Switch off (every public build).** The marker renders nothing: no empty frame, no placeholder
     text, no reserved space. Every page is complete without its figures: what a figure shows
     already exists as text or a table in the same section.
   - **Source files.** The figure files are not committed to this repository, which is meant to
     become public. A private build reads them from a copy of the book 1.6.1 release outside the
     repository; the code task defines how that location is given.
   - **Build checks.** A marker that names a figure the book release does not contain fails a
     private build. A public build fails if its output contains a book figure or an unresolved
     marker.
4. **Command excerpts: not in M1.** Commands that the book shows are not shown on M1 pages. Code on
   a page reads as something a visitor can run today, which is a status statement, and the site makes
   none. Recorded as an open item for a later milestone.

No statistics, readiness percentages, user counts, testimonials or logos of third parties, and no
status of any part. The site describes Swarma in its finished design state; the development state of
each part is collected in the book's chapter "Где мы и что дальше" (ch. 00 "Дизайн и готовность"),
and the site leaves it there.

## 8. Components

Each component lists its purpose, states, keyboard and screen-reader behaviour, and tokens. Tokens
are semantic roles; "type" refers to the shared type roles and scale.

### 8.1 Header

- **Purpose:** identify Swarma, reach the main routes, switch language.
- **Structure:** three stable zones on the shared header grid (`minmax(0, 13.75rem) minmax(0, 1fr)
  minmax(0, 13.75rem)`), height `--layout-header-height`. Inline start: the text wordmark (6.6).
  Centre: primary navigation (`nav` with an accessible name) to Platform, Principles, Book, Papers,
  Open source. Inline end: the language switch (8.3). The header is static (not sticky), so
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
  `--color-scrim` behind the drawer; PT Sans compact interface size for links.

### 8.2 Footer

- **Purpose:** provenance and wayfinding, not a second sitemap.
- **Content:** the Swarma name and its relation to Relux Works (section 5) with the approved
  lockup; the book's authors as named on the title page (ch. 00, title page); links to Book, Papers,
  Open source and the privacy page; the contact address from the site configuration; the
  accessibility statement only when it exists; the language switch repeated.
- **States:** default, hover, focus-visible for links.
- **Keyboard and screen reader:** `footer` landmark; link list in reading order; the lockup link has
  one accessible name, `Relux Works`.
- **Tokens and type:** `--color-surface-subtle` band, `--color-text-muted` for secondary text,
  `--color-link`, `--color-focus`, `--color-divider`; PT Sans compact interface size.

### 8.3 Language switch

- **Purpose:** move to the same route in the other language.
- **Behaviour:** rendered from the list of translations that exist for the current route. A
  counterpart that does not exist is not offered: no dead link and no disabled pseudo-control. In
  M1 only Russian pages exist, so the switch is absent while its header track keeps its width.
- **States:** default, hover, focus-visible, current (`aria-current="true"`).
- **Keyboard and screen reader:** native links; each label in its own language with a matching
  `lang` and `hreflang` (`Русский`, `English`).
- **Tokens and type:** `--color-link`, `--color-text` for the current item, `--color-focus`; PT Sans
  compact interface size.

### 8.4 Page title block

- **Purpose:** the one `h1` of the page, the lead and the version context.
- **Content:** title; lead paragraph; version context line with the book version and date from the
  book metadata; on documentation pages the section index. The block carries no status, no
  readiness marker and no "by design" disclaimer (section 11): the page body keeps the book's voice,
  which describes the finished design in the present tense.
- **States:** static.
- **Keyboard and screen reader:** `h1` first in `main`; the section index is a `nav` with an
  accessible name, a native `details` disclosure below 640 px.
- **Tokens and type:** PT Sans 700 at page-heading size (product-statement size only on the home
  page), PT Serif at lead size, `--color-text`; `--color-text-muted` for the version line, PT Mono
  for the version string.

### 8.5 Section with chapter reference

- **Purpose:** every content section shows where its content comes from.
- **Content:** section heading (`h2`, or `h3` within a group); body; a visible chapter reference
  below the body, linked to the matching entry on `/book/`. Russian format:
  `Источник: глава NN "Chapter title", раздел "Section title"`, for example
  `Источник: глава 05 "Ключи и ключник", раздел "Собеседника устанавливает ядро"`. A section that
  cites several sources separates them with `; `. Titles are verbatim from the book, in plain double
  quotes. The English format follows in M2.
- **States:** default; link hover and focus.
- **Keyboard and screen reader:** the reference is a normal link whose text names the chapter and
  section; no icon-only reference; headings form a meaningful outline.
- **Tokens and type:** full-width band, `--color-bg` or `--color-surface-subtle` alternating where
  bands need separation; PT Sans 700 at section heading size; body prose in PT Serif; PT Mono
  technical size for the reference in `--color-text-muted` with `--color-link` for its link.

### 8.6 Removed: status table and status row

The site shows no development status, so it has no status table, status row or status chip. The
number stays free so that the references to 8.7 and later components keep their meaning.

### 8.7 Callout for a guarantee's limits

- **Purpose:** state what a mechanism does not guarantee, next to the mechanism. The book names the
  limits of each guarantee (ch. 00 "Читатель"), and the site keeps them beside the claim.
- **Content:** a short heading ("Пределы" in Russian, "Limits" in English), the limits in the
  book's terms, the chapter reference.
- **States:** static.
- **Keyboard and screen reader:** an `aside` with an accessible name from its heading, placed in
  source order right after the text it qualifies. Not a live region, not collapsible.
- **Tokens and type:** `--color-surface-subtle` background, `border-inline-start` in
  `--color-border-strong`, `--color-text`; not the warning or error roles, because a limit is a
  property of the design, not an alert. Radius 0 on the bordered side, at most 8 px elsewhere.

### 8.8 Book and paper entry

- **Purpose:** one publication with its metadata.
- **Content:** title, subtitle where present, authors, version, date, language and a short abstract
  from the publication itself. Once the docs-side release pipeline exists: a link to the GitHub
  release of that build and the hashes from the release metadata. No PDF on the site itself.
- **States:** without a release: no link, no placeholder link, no disabled button. With a release:
  a native link to the release page and the hashes in PT Mono.
- **Keyboard and screen reader:** `article` with a heading; metadata in a description list; the
  version string LTR-isolated.
- **Tokens and type:** repeated entries may use a card (`--color-surface`, `--color-border`, radius
  8 px); PT Mono for version and date; `--color-text-muted` for metadata labels.

### 8.9 Code excerpt: not in M1

Dropped from M1 together with command excerpts (section 7, item 4). Recorded as an open item; when a
later milestone brings it back, it needs its own specification, which keeps code from reading as a
statement of what runs today.

### 8.10 Skip link

- **Purpose:** jump past the header to the main content.
- **Behaviour:** the first focusable element; visually hidden until focused, then visible at the
  inline start; targets `main` (`tabindex="-1"`).
- **Keyboard and screen reader:** native link with the text "Перейти к содержанию" in Russian and
  "Skip to content" in English.
- **Tokens and type:** `--color-strong-action` background, `--color-on-strong-action` text,
  `--color-focus` outline; PT Sans compact interface size.

### 8.11 Book figure (private builds only)

- **Purpose:** show a book diagram unchanged where the build switch allows it (section 7, item 3).
- **Content:** the book's SVG; a `figcaption` with the book's caption for the figure and the source
  line `Источник: книга Swarma, версия 1.6.1, глава NN, рисунок: <подпись>` (section 7, item 3).
- **States:** switch off: renders nothing. Switch on: the figure, with its dimensions declared from
  the SVG view box before it loads.
- **Keyboard and screen reader:** `figure` with `figcaption`; the image has `alt` equal to the
  book's caption; the section text carries the full description. Not focusable.
- **Tokens and type:** the design system's diagram bridge: the unchanged SVG as an image on
  `--color-figure-ground` (white in every appearance) with `--space-4` padding, a 1 px
  `--color-figure-frame` border and `--radius-surface` corners; caption in PT Sans at compact
  interface size in `--color-text-muted`, outside the white block; source line in PT Mono at
  technical size. Its legibility in dark and forced-colours appearances is a private-build check; an
  unreadable figure is reported, never recoloured.

### 8.12 Repository row

- **Purpose:** one open-source repository of a Swarma module on `/open-source/`.
- **Data:** from `config/repos.json`: repository name and description key.
  The GitHub organisation comes from one site configuration value. The description is one line in
  book terms; the repository's own README is never the source.
- **Content:** the repository name as a native link to the repository and the one-line description.
  No status, readiness marker or release state per repository.
- **States:** default; link hover and focus-visible; long names and descriptions wrap without
  changing the row grid.
- **Keyboard and screen reader:** a list or table with native semantics; the link text is the
  repository name.
- **Tokens and type:** repository name in PT Mono, description in PT Sans body size,
  `--color-text`, `--color-link`, `--color-focus`, `--color-divider` between rows.

## 9. Route outlines (M1)

Wireframes in text. Each line names a section and what it shows, with the chapter it draws on. Final
wording is written in the content tasks. Every page ends with the footer; every content section
carries its chapter reference (8.5).

Every outline item describes Swarma in its finished design state, in the book's voice and in the
present tense. No item invites a visitor to install, run, download or use a part of Swarma, no item
links to an application, a store page or a command, and no item states a status, a readiness marker
or a "by design" disclaimer.

### `/ru/` (home)

1. Title block: "Swarma" and the literal category (ch. 00, title page); one paragraph with the three
   layers (ch. 00 "Три слоя Swarma"); action to the book, link to the open-source page.
2. The problem: the three questions familiar to anyone who has run several coding agents at once:
   who acts, on what grounds, who answers for the result when a session stops (ch. 00 "Для кого эта
   книга", opening; ch. 01 "Кто говорит и что ему разрешено", "Ответственность не передаётся
   отправкой").
3. The answer in one view: boundaries on one machine joined to boundaries between owners, built on
   existing agent environments rather than a model or harness of its own (ch. 01 "Какой ответ мы
   ищем").
4. The three layers, one line each, linking to the layer pages (ch. 02 "Имена и участники").
5. The seven principles by name, linking to `/principles/` (ch. 03, section headings).
6. The book: the book entry (8.8) and the reading routes for different readers (ch. 00 "Карта пяти
   частей").

### `/ru/platform/` (overview)

1. Title block: Swarma as three layers, each answering its own question
   (ch. 02, opening).
2. Layer order: numbered bottom-up, built in the other direction (ch. 02, opening; "Порядок
   постройки").
3. Names: the platform, the three layers, Swarma Keeper and Swarma Curator, and why the key holder
   (Swarma Keyholder) is not the keeper (ch. 02 "Имена и участники").
4. The six roles: owner, operator, agent, project, contributor, donor (ch. 02 "Имена и участники").
5. One path through the three layers (ch. 02 "Один путь через три слоя").
6. The characteristic failure at each boundary, as a limits callout (ch. 02 "Один путь через три
   слоя", closing paragraphs).
7. Links to the three layer pages.

### `/ru/platform/runtime/`

Each mechanism section shows what it does and its limit, with a limits callout where the chapter
names one.

1. Title block: the swarm on one owner's machines (ch. 02 "Swarma
   Runtime: границы на одной установке").
2. One OS user per agent and the agent's network (ch. 04 "Почему пользователь ОС", "Машина
   выбирает сеть", "Станция и её гарантии"; limits: "Пределы границы").
3. Keys and the key holder (ch. 05 "Мастер-секрет и стабильная личность", "Собеседника
   устанавливает ядро"; limits: ch. 02 "Swarma Runtime: границы на одной установке", on secrets
   the agent can still see).
4. Grants: delegation only narrows, revocation and unknown state (ch. 06 "Делегирование только с
   ослаблением", "Отзыв и неизвестное состояние").
5. Message path and bridge: the carrier delivers, signature and grant authorise (ch. 02 "Swarma
   Runtime: границы на одной установке"; ch. 07 "Носитель не становится источником полномочий";
   ch. 08 "Допуск к носителю", "Зачем нужен допуск").
6. Launch and session host (ch. 09 "Запуск агента и хост сессий", "Матрёшка запуска", "Служба,
   раннер и единственный писатель").
7. Swarma Keeper: a handover completes with an action (ch. 10 "Передача завершается действием").
8. Swarma Curator: skills, profiles, overlays (ch. 11 "Скилл, профиль и оверлей").
9. Credentials and logins (ch. 12 "Брокер: одна подписка, аренды на запуски").
10. Remote workplace: a separate OS user on the project machine, while the model works
    on the donor's subscription (ch. 13 "Модель думает у донора, руки у нас").
11. Task board: integration compares the exact head (ch. 14 "Почему интеграция сравнивает точную
    голову").
12. Model router: deterministic choice (ch. 15 "Почему выбор детерминирован").
13. Agent memory (ch. 16 "Назначение").
14. Operator and interfaces: the companion phone app shows the exact action and signs
    it with a key in the phone's secure chip once the person confirms presence (ch. 17 "Телефон
    оператора").

### `/ru/platform/protocol/`

1. Title block: one environment, several owners (ch. 18 "Одна среда,
   несколько владельцев").
2. Three planes: thinking, governance, execution (ch. 18 "Три плоскости работы"; ch. 02 "Swarma
   Protocol: совместная работа независимых владельцев").
3. What crosses the network (ch. 18 "Что пересекает сеть").
4. Log, quorum certificate and the trust levels L0 to L2 (ch. 19 "Запись и её совершение", "Три
   уровня доверия").
5. Task contract: the plan permits, the contract requires; three outcomes (ch. 20 "План разрешает,
   контракт требует", "Профиль свойств и три исхода").
6. Orchestrator lease, epoch and fencing token (ch. 21 "Аренда, эпоха и fencing-токен").
7. Candidate, independent review and atomic head advance; the five steps of a change (ch. 21 "Кто
   проверяет кандидата", "Атомарное продвижение головы"; ch. 02 "Swarma Protocol: совместная
   работа независимых владельцев").
8. External effects, stop with one signature, federation (ch. 23 "Остановка одной подписью",
   "Федерация проектов").
9. Limits callout: what the protocol does not guarantee (ch. 24 "Явные пределы обещания"), and where
   a bounded model check ends (ch. 22 "Где заканчивается установленный результат").

### `/ru/platform/chain/`

1. Title block: the participant beyond one project (ch. 02 "Swarma
   Chain: участник за пределами проекта").
2. Three sublayers: chain, p2p memory, social graph, each with its own guarantee (ch. 02 "Swarma
   Chain: участник за пределами проекта"; ch. 27 "Три подслоя с разными обязательствами").
3. Identity cell (ch. 25 "Ячейка личности"; limits: "Границы").
4. Attestations and portable reputation (ch. 26 "Что в свидетельстве"; limits: "Чего репутация не
   обещает").
5. Chain design: where consensus ends, the hash-only cryptographic profile, names (ch. 27 "Где
   заканчивается консенсус", "Криптографический профиль: только хэш-функции", "Имена").
6. Social layer and network memory: pointer apart from the file, the graph decides what the network
   remembers (ch. 28 "Публикация: указатель отдельно от файла", "Граф решает, что помнит сеть").

### `/ru/principles/`

1. Title block: the three layers face different adversaries, so one idea
   needs a different mechanism on each layer (ch. 03, opening).
2. Seven sections, one per principle, in the book's order, each with its purpose and three rows,
   Runtime, Protocol, Chain (ch. 03, the seven sections):
   - "Ключ задаёт личность, агент просит подпись";
   - "Полномочия только сужаются";
   - "Журнал хранит истину, сессия модели служит кэшем";
   - "Суждение моделей остаётся вне консенсуса";
   - "Одобрение относится к точным версиям";
   - "Чего нельзя проверить, то не разрешено";
   - "Человек подписывает своё действие".
   The three rows use a repeated structured-row grid, not cards.
3. Reading the guarantees together, with the outer limits as a limits callout (ch. 03 "Как читать
   гарантии вместе").

### `/ru/book/`

1. Title block: the book entry (8.8): title, subtitle, authors, version, date (ch. 00, title page).
2. What the book is: architecture, not installation (ch. 00 "Для кого эта книга"). Among the book's
   editions the Russian one is the source of truth, and where the book and the module
   specifications differ, the specifications prevail (ch. 00, title page notes).
3. Map of the five parts with their main questions (ch. 00 "Карта пяти частей").
4. Reading routes for the owner of an installation, the runtime engineer, the distributed-systems
   engineer and the reader interested in the chain (ch. 00 "Карта пяти частей").
5. No link and no PDF until the docs-side release pipeline publishes the book as a GitHub release;
   then the entry links to that release and shows its hashes.

### `/ru/papers/`

1. Title block: the papers that accompany the book.
2. One paper entry (8.8) per paper, metadata and abstract from the paper itself; no link until the
   release pipeline publishes the paper as a GitHub release.
3. The relation to the book: where a chapter refers to a paper, the paper entry links that chapter
   (for example ch. 27 "Имена" refers to a table of the paper on Swarma Chain).

### `/ru/open-source/`

Title "Открытый код".

1. Title block: a short introduction: the book describes the architecture, the module documentation
   describes installation and commands, and module specifications set exact formats (ch. 00 "Для кого
   эта книга"; ch. 00 "Как устроено объяснение").
2. The repository list, rendered from `config/repos.json` by the repository row component (8.12):
   one row per repository with its name, a link to the repository and a one-line description in
   book terms; no status per repository. The GitHub organisation is one value in the
   site configuration, so the links follow the repositories if they move.

### `/ru/privacy/`

Title "Приватность". A short statement and nothing more: the site sets no cookie, runs no analytics
or third-party scripts, has no forms and collects no personal data; hosting logs are kept by the
hosting provider under its own terms. The contact address is in the footer (8.2). No legal
boilerplate and no book references.

## 10. Validation matrix

The completion gate of the design system applies to every release. Cells name what is checked;
"all M1 routes" means the ten routes in section 9.

| Dimension | Values | Routes and states |
| --- | --- | --- |
| Width | 390, 768, 1440, 1920 CSS px | all M1 routes; header open and closed below the navigation breakpoint |
| Appearance | light, dark, light increased contrast, dark increased contrast | all M1 routes at 390 and 1440 |
| Forced colours | active (Windows High Contrast or emulation for screenshots, real for release) | home, one layer page, book, footer lockup |
| Motion and transparency | reduced motion, reduced transparency | mobile drawer open and close |
| Language | Russian (M1); English (M2), each route against its counterpart | all routes per language; longest real labels in header and footer |
| Script | Cyrillic and Latin, including Latin names inside Russian text | headings, wordmark, the book page's table of parts |
| Direction | LTR only; no RTL locale. Components use logical properties so RTL needs no redesign | not applicable until an RTL locale exists |
| Zoom | 200 % text zoom, 400 % browser zoom, larger default font size | home, book, one layer page |
| Keyboard | full journey: skip link, header, drawer, section index, table scroll region, footer | all M1 routes |
| Interactive states | default, hover, focus-visible, pressed, current page, expanded and collapsed, per component: header links, menu button, drawer, language switch, section index disclosure, chapter reference links, footer links, table scroll region, skip link | all M1 routes at 390 and 1440. Loading, success, warning and error are not applicable in M1: no component fetches data, submits a form or reports a result, and the site has no forms |
| Long and empty content | longest chapter and section title cited in a chapter reference; longest translated navigation label; longest cell in the book page's table of parts; a page with every figure switched off | book, each layer page, header, footer |
| Drawer reversal | rapid open-close-open on the menu button, by pointer and by keyboard, including during the transition | 390 and 768 px, with and without reduced motion: no jump, no stale overlay, focus back on the button |
| Build mode | public (`SWARMA_BOOK_FIGURES` unset or not `1`): no book figure and no marker text in the output, every page complete; private (`SWARMA_BOOK_FIGURES=1`): each marked figure unchanged, with caption and source line | public mode on all M1 routes; private mode on every route with a marker |
| Screen reader | macOS Safari + VoiceOver; Windows NVDA with Firefox or Chrome; Android Chrome + TalkBack; iOS Safari + VoiceOver for the primary mobile journey | home, one layer page, book |

Checks required for each release:

- Repository build and every repository check pass, including i18n completeness, the
  availability-language lint, the names check, the forbidden-identifier scan and the public-build
  figure check (section 7, item 3).
- Availability-language lint: rejects readiness phrases, in Russian and English, in content files
  and in the rendered text of every page. The site has no status markup, so no element is exempt.
  Its phrase list and its allow-list live in the repository; every allow-list entry names the file,
  the exact sentence and the reason. Initial phrase list: работает сегодня, уже работает,
  реализовано, реализован, готово к, доступно, в разработке, запущено, выпущено, бета; works today,
  already works, implemented, available now, ready to use, in development, released, live, beta,
  coming soon, production-ready.
- Names check: the book's names only (section 4), retired and non-book names rejected (section 11),
  and infrastructure product names rejected in site content: messaging servers such as Matrix, VPN,
  hosting, peer-to-peer transport and virtualisation products. Agent environments the reader uses,
  such as Claude Code and Codex, are not on that list.
- Russian copy check: rendered Russian pages and Russian locale strings contain no guillemets and no
  dash used as a connector (8.5, section 4).
- `axe-core` in a real browser after each state is stable; the gate fails on any WCAG A or AA tagged
  violation and on any serious or critical one. No global rule suppression.
- Geometry: root `scrollWidth` at most one pixel wider than `clientWidth`; navigation centre within
  one pixel of the viewport centre at desktop widths; header and control boxes unchanged across
  routes and states; no clipped controls or text overlap.
- Contrast: the design system's `scripts/check_contrast.py` passes on the copied token file and its
  `--control` run fails; the pairs in the system's contrast report are re-measured from the built CSS
  in every appearance.
- Token use: every `--color-*`, `--font-*` and layout token the site's CSS uses exists in the copied
  token file, and no literal colour appears outside it.
- Role colours: role colours appear only on elements with that role, named in text; no status
  colour token appears in the site's CSS.
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
| Gradient orbs, glow fields, bokeh, decorative glass | Common decoration for AI products; it carries no information and the design system forbids it as structure |
| Swarm, hive or bee imagery, particles, node-graph backdrops | Decoration standing in for the architecture; abstract imagery where real material (the book, the diagrams) should be shown |
| Redrawn, retyped, recoloured or animated Relux Works artwork | The operator mark is fixed production artwork |
| Status lists, readiness markers and "by design" disclaimers, in any form: status pages, tables, rows, chips, excerpts, status colours, readiness percentages, progress bars, counters, traffic lights, status in prose or in headings, a design-versus-state frame line | The site describes Swarma in its finished design state, as the book does; the book's chapter "Где мы и что дальше" carries the development state of each part (ch. 00 "Дизайн и готовность") |
| Infrastructure product names: Matrix and other messaging servers, VPN, hosting, peer-to-peer transport and virtualisation products | The site names the role, for example "транспорт сообщений" / "message transport" or the book's "носитель". Agent environments the reader uses (Claude Code, Codex) may stay where the book uses them |
| Role colours with a meaning the book's diagrams do not give them, or as decoration | The roles keep one meaning on every page and figure |
| Retired or non-book names: "Swarm Signer", other names with the "Swarm" prefix instead of "Swarma", "Colony", "Swarm cell", apiary names | The book's names are the only names; book 1.6.1 aligned them on the "Swarma" family |
| A drawn, traced or generated Swarma mark, or a placeholder for one | The mark slot waits for the owner's artwork (6.6) |
| Generic claims about security, scale or AI capability | Every claim needs a chapter; the book names the limits of each guarantee |
| Testimonials, user counts, partner logos | Nothing of the kind exists to show |
| One-hue page, pure black or pure white interface colours | Family colour rules; glare and loss of depth in dark mode |
| Font size tied to viewport width, negative letter spacing | Family type rules; multilingual consistency |
| Cards as section wrappers, nested cards, radii above 8 px | Family geometry; cards only for repeated entries such as books and papers |
| Hover-only information, hidden focus, motion without a reduced-motion equivalent | Accessibility baseline |
| `overflow-x: hidden` to hide broken geometry | Geometry must be fixed, not concealed; wide tables use a labelled scroll region |
| Scroll-triggered entrance animations | Motion must communicate state; the site has no live state |
| Third-party fonts, analytics or tracking scripts | Not needed for reading; the design system's trust rules avoid tracking by default |

## 12. Intentional deviations from the design system

| Deviation | Family rule | Reason |
| --- | --- | --- |
| No site search in M1 | The documentation archetype puts navigation, search and version context in the first screen | M1 has ten routes, each documentation page has a section index, and the book is the complete reference. Search returns when the English pages or further routes make navigation alone insufficient |

Colour-level deviations, such as the accent's closeness to the information role, are recorded in the
design system, which owns the palette.

## Open items

- The design system's review outcome gates the release use of the copied token file (section 4).
- Owner approval of the favicon proposal (section 5). Accent, neutrals and wordmark are the design
  system's.
- Book and paper links and public diagrams wait for the docs-side release pipeline (section 7,
  items 1 and 3; 8.8). Owner decision still open: the legal line in the footer (section 5).
- The accessibility statement page and its route are not in the M1 route list; the design system
  requires one before a public release.
- Command excerpts and the code excerpt component (section 7, item 4; 8.9) are out of M1 and wait
  for a later milestone.
