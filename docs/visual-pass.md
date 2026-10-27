# Swarma site: visual pass

This pass answers the owner's feedback that the site reads as a raw document. It audits the built site and gives a
layout specification that the implementation can follow without further design decisions. It also proposes the
contract amendments that the specification needs. Every rule of the design contract that is not amended here
stands: no hero imagery, no status, no infrastructure product names, the accessibility and contrast gates, the
editorial voice and the Russian copy rules.

## 1. Method

- Build: `origin/main` at `b78d2ae`, public mode (book figures off, as in production).
- Routes: all 21 built pages, that is the root locale selection plus ten routes in each of Russian and English. This is the audit baseline; the implementation also checks the 404 page added by the deployment contract, matching the current source route inventory.
- States: 390 × 844 and 1440 × 900 CSS px, light and dark system appearance, so 84 captures. Each capture has a
  first-viewport screenshot, and the light appearance also has a full-page one.
- Measurements: computed font family, size, weight and line height of `h1`, `h2`, `h3`, lead, version line and
  source line; boxes of the header, logo, navigation links, section index and `main`; horizontal overflow; the `h2`
  headings inside the first viewport.
- Screenshots are working material and are not committed.

No route overflows horizontally, and the dark appearance shows no glare or contrast fault beyond the structural
problems below, which are the same in both appearances.

## 2. Findings

Each finding names the route and width where it shows, what reads wrong, why, and the rule it breaks or the rule
that is missing. "All documentation routes" means `/platform/`, the three layer pages, `/principles/` and
`/open-source/` in both languages.

| # | Where | What reads wrong | Why | Rule |
| --- | --- | --- | --- | --- |
| F-1 | All documentation routes, 1440 | The section index is a 45rem-wide stack of 1rem underlined links in the main column: 220 px tall on `/platform/`, 616 px on `/platform/runtime/` (13 links), 264 px on the home page. It reads as content, pushes the first section below the fold, and leaves the right 508 px of the 1228 px container empty | The index has no desktop placement; `.section-index` sits in the text flow with `details open` and the body link style | Missing: a desktop documentation layout. Contract 8.4 places the index in the title block and gives no desktop position |
| F-2 | All routes with an introduction, all widths | The introduction's own source line ("Источник: ...") is rendered after the section index, separated from the text it cites | The renderer inserts version line and index right after the lead, before the rest of the introduction | Contract 8.5: the reference sits below the body it cites |
| F-3 | `/platform/`, 1440 | The three layers are not in the first viewport. The fold ends at the first `h2` ("Порядок слоёв"); the layers appear only in "Имена", about 1500 px down | The page has no layer block; the lead is a six-line paragraph followed by the index | Contract section 3: on `/platform/` the three layers with one line each are visible without scrolling at 1440 px |
| F-4 | Every route with a version line, all widths | "Книга Swarma, 1.6.1, октябрь 2026" shows the version as "1 . 6 . 1" | The version is set in PT Mono (`bdi.technical`); its full-cell period reads as spacing between the digits | Contract 8.4 tokens ("PT Mono for the version string"); the design system's technical role |
| F-5 | Every route, all widths | Source lines read like code: PT Mono 0.75rem, underlined, muted, with straight quotes | `.chapter-reference` uses the technical face | Contract 8.5 ("PT Mono technical size for the reference") |
| F-6 | All documentation routes | Hierarchy is flat on desktop. The page heading is 3.5rem and the section heading 2.75rem (ratio 0.79), and with 8 to 14 sections per page every `h2` reads like a chapter title | The design system's section step was made for landing pages with few sections; documentation pages have many | Missing: a documentation step for `h2` |
| F-7 | All documentation routes | Sections run into each other: no rule, band or extra space marks where one `h2` section ends, only the 4rem top margin of the next heading | No section wrapper or separator | Contract 8.5 allows bands "where bands need separation" but gives no rule for when |
| F-8 | Every route, 1440 | The header navigation is small next to the logo: 0.8125rem links next to a 160 × 56 px lockup | Navigation uses the compact interface size | Contract 8.1 ("PT Sans compact interface size for links") |
| F-9 | Every route, 1440 (header and footer) | Uneven gaps between navigation links: "Книга" → "Работы" and "Book" → "Papers" show about twice the gap of the other pairs | Short labels are narrower than the 44 px minimum target, and the text sits at the start of the box, so the empty part of the target adds to the visible gap | Design-system target rule applied without centring |
| F-10 | Every route, 390 | The header is 141 px tall and takes two rows: the lockup on the first, the language switch and the menu button on the second | The 160 px lockup minimum, two language links and the menu button do not fit in 342 px | Contract 8.1 fixes the header height (`--layout-header-height`); missing: where the language switch goes when space is short |
| F-11 | Home, all widths | The primary action is a lone underlined "Книга" link after the version line. The secondary "Открытый код" link stands in a separate content paragraph after the section index, next to a second link to the book. Neither reads as an action | No action component; the content repeats the book link | Contract section 3 (one primary action, one secondary link) |
| F-12 | Home, all widths | The introduction says the same thing three times. The category line repeats the subtitle, the lead repeats the category, and the three-layer paragraph follows. At 390 px no action is in the first viewport | Content and generated category line overlap | Design system hierarchy rule: "Do not repeat the same statement in the eyebrow, heading, paragraph and button" |
| F-13 | Home, all widths | The home page has a section index | The renderer adds an index to every page with headings | Contract section 3 lists no index for the home page's first viewport; the home page is an editorial publication, not documentation |
| F-14 | `/book/`, `/papers/` | Book metadata appears three times: in the publication entry, in the lead sentence, and in the version line | Generated version line plus content plus entry | Contract 8.8 (the entry carries the metadata) |
| F-15 | Layer pages, `/principles/` | Each limits callout shows the label twice: the heading "Пределы" and the bold prefix "Предел." | The content convention `> **Предел.**` is kept inside the component that adds its own heading | Contract 8.7 (short heading, then the limits) |
| F-16 | `/principles/` | The per-layer mechanism of each principle is three plain paragraphs that start with a bold layer name | The renderer has no row component | Contract section 9, `/principles/` item 2: "a repeated structured-row grid, not cards" (implementation gap, no amendment needed) |
| F-17 | English routes | The version line shows the Russian date ("октябрь 2026"). The footer, the book entry and the paper entries show the Russian spelling of the authors. `/en/book/` lists chapter 31 as "Словарь" | `src/data/publications.json` and `src/data/book-chapters.json` carry one language | Owner decision on the English author spelling; i18n completeness (contract section 10) |

The orchestrator's first read, checked against the build:

| Point | Verdict |
| --- | --- |
| 1. Section index | Confirmed (F-1); also F-2 |
| 2. Three layers on `/platform/` | Confirmed (F-3) |
| 3. Version and source in mono | Confirmed (F-4, F-5) |
| 4. Flat hierarchy, no separation | Confirmed (F-6, F-7) |
| 5. Navigation gap and size | Confirmed, with the cause (F-8, F-9); also F-10 on mobile |
| 6. Home action | Confirmed (F-11); also F-12, F-13 |

## 3. Layout specification

All values are design-system tokens or the design system's fixed type scale (section headings below name the scale
step). The site keeps its two existing breakpoints and adds one:

- 640 px: mobile type steps;
- 1024 px: documentation layout, new;
- the navigation breakpoint where the header switches to the menu, existing.

### S-1. Documentation layout (≥ 1024 px)

Applies to `/platform/`, the three layer pages, `/principles/` and `/open-source/`, in both languages.

- `main` holds a grid `.page-grid`:
  - `grid-template-columns: minmax(0, var(--layout-reading)) 15rem;`
  - `column-gap: var(--space-16);`
  - `grid-template-rows: auto 1fr;`
  - `align-items: start`.
  The content column stays 45rem. At 1440 px the grid uses 1024 px of the 1228 px container.
- Row 1, column 1: the title block (`.title-block`): `h1`, the lead, the layer rows on `/platform/` (S-3), the rest of
  the introduction with its source line, then the version line (S-6).
- Rows 1 to 2, column 2: the section index (S-2).
- Row 2, column 1: the page body (`.page-body`), one `section.doc-section` per `h2` (S-5).
- DOM order: title block, section index, page body. Keyboard order is therefore title, index, body, the same as the
  current reading order.

### S-2. Section index

At ≥ 1024 px:

- `nav.section-index` with the accessible name "На этой странице" / "On this page";
- `position: sticky; inset-block-start: var(--space-8); align-self: start;`
- `max-block-size: calc(100dvh - 2 * var(--space-8)); overflow: auto`.

Contents:

- **Heading:** a `p` (not a heading element), PT Sans 700, compact interface size (0.8125rem / 1.45),
  `--color-text-muted`, `margin-block: 0 var(--space-3)`.
- **List:** `ul` with no bullets, `border-inline-start: 1px solid var(--color-divider)`.
- **Links:** PT Sans 400, compact interface size, `--color-text-muted`, no underline. `display: flex;
  align-items: center; min-block-size: 44px; padding-inline-start: var(--space-4)`. Hover `--color-link-hover` with
  underline. Focus uses the global `--color-focus` outline. No scroll-linked highlighting and no script.
- **Disclosure:** no `details` at this width; the summary is not rendered.

Below 1024 px:

- The same `nav` sits after the title block, as a native `details` disclosure, closed by default.
- `summary`: PT Sans 700, body size (1rem), `min-block-size: 44px`.
- Links: PT Sans 400, body size, `--color-link`, underlined, `min-block-size: 44px`.
- `margin-block: var(--space-6) var(--space-8)`.

Remove the current script that forces the disclosure open at ≥ 640 px.

Pages without a section index: home, `/book/`, `/papers/`, `/privacy/`.

### S-3. Layer rows (`/platform/` and home)

A new component `ol.layer-rows` with three items in the fixed order Runtime, Protocol, Chain, as the design system's
identity reference requires for the three layers together.

Layout:

- **Row:** `display: grid; grid-template-columns: 7rem minmax(0, 1fr); column-gap: var(--space-4);
  padding-block: var(--space-4); border-block-start: 1px solid var(--color-divider)`. The last row also has
  `border-block-end`.
- **Column 1:** the layer number, "слой 2" / "layer 2", in PT Mono 400, technical size (0.75rem / 1.45),
  `--color-text-muted`. The design system's technical face for layer labels; the only mono text in the title block.
- **Column 2:**
  - first line: the layer name as a link to its page, PT Sans 700, subsection heading size (1.25rem / 1.38),
    `--color-link`, underline on hover only;
  - second line: one sentence in PT Sans 400, body size (1rem / 1.55), `--color-text`.
- **Below 640 px:** `grid-template-columns: minmax(0, 1fr)`. The number sits above the name.
- `margin-block: var(--space-6) var(--space-8)`.

The rows read from `src/data/layers.json`, with one entry per layer: `id`, `number`, `href`, `name`, and a
`line` in `ru` and in `en`. The text is fixed: it is the accepted wording of the home page, sourced from ch. 00 "Три
слоя Swarma". The Russian lines keep the non-breaking spaces of the Russian copy rules after
one-letter words, as in the home page source.

| Layer | ru | en |
| --- | --- | --- |
| 2, Swarma Runtime | Держит рой на машинах одного владельца: пользователей ОС, ключи, полномочия, сессии и окружение агентов. | Holds the swarm on the machines of one owner: OS users, keys, capabilities, sessions and the agents' environment. |
| 1, Swarma Protocol | Задаёт правила совместной работы независимых владельцев над единой средой исполнения проекта. | Sets the rules for joint work of independent owners over one project execution environment. |
| 0, Swarma Chain | Хранит общий слой личностей, свидетельств о работе, имён и расчётов, который существует за пределами отдельного проекта. | Holds a shared layer of identities, evidence of work, names and settlements that exists beyond any single project. |

Placement:

- The content places the component with a marker line `[[layers]]`.
- `/platform/` (both languages): right after the lead.
- Home (both languages): it replaces the three-layer paragraph.
- The source line of that introduction stays as it is.

First-viewport budget at 1440 × 900 on `/ru/platform/`: header 81 px, `main` top padding 48 px, `h1` 86 px with
margin, lead 216 px with margin, layer rows about 340 px (each sentence wraps to two lines in the 37rem text column), version line 51 px. That
totals about 820 px, inside 900 px.

### S-4. Type scale

Page and product steps are the design system's; only the documentation `h2` changes (deviation, section 5).

| Element | Desktop (≥ 640 px) | Mobile (< 640 px) | Face | Spacing |
| --- | --- | --- | --- | --- |
| Home `h1` | product statement 4.5rem / 1.06 | 2.75rem / 1.06 | PT Sans 700 | `margin-block: 0 var(--space-4)` |
| `h1` | page heading 3.5rem / 1.1 | 2.5rem / 1.1 | PT Sans 700 | `margin-block: 0 var(--space-6)` |
| Documentation `h2` | 2rem / 1.16 (design system's mobile section step, deviation D-1) | 2rem / 1.16 | PT Sans 700 | `margin-block: 0 var(--space-6)` inside its section (S-5) |
| Home `h2` | section heading 2.75rem / 1.16 | 2rem / 1.16 | PT Sans 700 | as above |
| `h3` | subsection 1.25rem / 1.38 | 1.125rem / 1.38 | PT Sans 700 | `margin-block: var(--space-8) var(--space-4)` |
| Lead | 1.25rem / 1.6 | 1.125rem / 1.6 | PT Serif 400 | `margin-block: 0 var(--space-6)` |
| Body | 1rem / 1.65 | 1rem / 1.65 | PT Serif 400 | `margin-block: 0 var(--space-6)` |
| Category line (home) | 1.25rem / 1.5 | 1.25rem / 1.5 | PT Sans 400, `--color-text-muted` | `margin-block: 0 var(--space-8)` |

At 1440 px the documentation hierarchy becomes `h1` 56 px, `h2` 32 px, `h3` 20 px (ratios 0.57 and 0.63).

### S-5. Section rhythm

- **Documentation pages.**
  - The renderer wraps each `h2` with its content up to the next `h2` in `section.doc-section` with
    `aria-labelledby` set to the heading id.
  - Each section has `border-block-start: 1px solid var(--color-divider);
    padding-block-start: var(--space-12); margin-block-start: var(--space-12)` (desktop) and
    `var(--space-8)` / `var(--space-8)` (mobile).
  - The first section has the same rule, which separates it from the title block.
  - No alternating backgrounds: on pages with 8 to 14 sections they would read as stripes.
- **Home.**
  - Sections alternate full-width bands. Odd bands use `--color-bg` and even bands use
    `--color-surface-subtle`.
  - Each band spans the viewport, with the content in `.container`, and has
    `padding-block: var(--layout-section)` on desktop and `var(--layout-section-mobile)` on mobile.
  - The `h2` margin is 0 at the top of a band.
- **The last element of a section** (normally the source line) has `margin-block-end: 0`.

### S-6. Version line and source line

- **Version line** (`p.version-context`):
  - PT Sans 400, compact interface size (0.8125rem / 1.45), `--color-text-muted`,
    `font-variant-numeric: tabular-nums`;
  - the version and the date are plain text in that face, not `.technical`. The version stays in `bdi` for
    direction isolation;
  - `margin-block: var(--space-2) 0`;
  - it is shown on documentation pages only, not on home, `/book/`, `/papers/` or `/privacy/` (S-9);
  - the date follows the page language: "октябрь 2026" / "October 2026" (F-17).
- **Source line** (`p.chapter-reference`):
  - PT Sans 400, compact interface size, `--color-text-muted`;
  - the label "Источник:" / "Source:" is plain text; each reference is a link in `--color-link`, underlined;
  - `margin-block: var(--space-4) 0` inside a section;
  - the text is unchanged.
- **Figure captions** use the same source-line style.
- **Data list in publication entries:** the version and the date use PT Sans with `tabular-nums` instead of PT Mono.
- **PT Mono stays** for code, repository names, identifiers and the layer numbers of S-3.

### S-7. Header

- **Navigation links**, header and footer:
  - PT Sans 400, body size (1rem / 1.45), `--color-text`; hover `--color-link-hover`;
  - the current page is marked by an underline (`text-underline-offset: .3em`) that does not change the box;
  - targets: `display: inline-flex; align-items: center; justify-content: center; min-block-size: 44px;
    min-inline-size: 44px; padding-inline: var(--space-1)`. Centring removes the uneven gaps of F-9;
  - `ul` gap: `var(--space-6)`.
- **Language switch:** PT Sans 400, compact interface size, targets as above, gap `var(--space-3)`.
- **Fit at desktop:** the Russian navigation needs about 520 px and the English about 500 px. Inside the
  three-column header (172 px brand track, navigation, 172 px end track) it stays one row at ≥ 1024 px. The existing
  measurement script still decides when to switch to the menu.
- **Below the navigation breakpoint:**
  - the header is one row: lockup at the start, the menu button at the end;
  - the language switch moves into the drawer, after the navigation, under a `p` label "Язык" / "Language"
    (compact interface size, `--color-text-muted`);
  - the header block size is `--layout-header-height` at every width (68 px; F-10).
- The lockup is unchanged: at least 160 CSS px wide with its clear space (contract 6.6).

### S-8. Home title block and primary action

Order:

1. `h1` product statement.
2. Category line.
3. Layer rows (S-3).
4. Action row.
5. The source line of the introduction.

No section index (F-13). The lead sentence that repeats the category is removed from the content (F-12).

Action row: `div.home-actions`, `display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-6);
margin-block: var(--space-8) var(--space-4)`.

- **Primary action:** the link "Книга о Swarma" / "The book on Swarma" to `/ru/book/` / `/en/book/`, as the new
  component 8.13 "Primary action link" (section 5):
  - `display: inline-flex; align-items: center; min-block-size: 44px;
    padding-block: var(--space-3); padding-inline: var(--space-6)`;
  - PT Sans 700, body size;
  - `color: var(--color-on-strong-action); background: var(--color-strong-action);
    border-radius: var(--radius-control); text-decoration: none`;
  - hover `background: var(--color-strong-action-hover)`; pressed `--motion-press` timing; focus the global outline;
  - forced colours: `border: 1px solid ButtonText`.
- **Secondary link:** "Открытый код" / "Open source" to `/ru/open-source/` / `/en/open-source/`, PT Sans 400, body
  size, `--color-link`, underlined, `min-block-size: 44px`.
- The content paragraph "Книга о Swarma · Открытый код" is removed, since the action row replaces it.

At 390 × 844 the action row then sits at about 760 px, inside the first viewport, with the 68 px header.

### S-9. Book and papers

- `/book/` and `/papers/` have no version line: the entry carries version and date.
- On `/book/` the lead sentence that restates title, subtitle, authors, version and date is removed from the
  content (F-14); the entry shows them.
- Entries keep the card of contract 8.8.

### S-10. Limits callout and principle rows

- **Limits callout:** when the first paragraph inside a callout starts with `<strong>Предел.</strong>` /
  `<strong>Limit.</strong>`, the renderer drops that `strong` and the following space. The heading "Пределы" /
  "Limits" carries the label (F-15). The content files stay as they are.
- **Principle rows:** on `/principles/`, the three paragraphs that start with `**Swarma Runtime.**`,
  `**Swarma Protocol.**` and `**Swarma Chain.**` become one `dl.layer-rows--principle` (F-16):
  - each row: `dt` = the layer name without the period, PT Sans 700, body size; `dd` = the rest of the paragraph,
    PT Serif 400, body size, `margin: 0`;
  - grid `grid-template-columns: 10rem minmax(0, 1fr); column-gap: var(--space-6);
    padding-block: var(--space-4); border-block-start: 1px solid var(--color-divider)`;
  - one column below 640 px.

### S-11. Acceptance checks for the implementation

Measured in the built site at 390 × 844 and 1440 × 900, light and dark, both languages:

1. At 1440, on documentation pages:
   - the section index box starts at least `45rem + 4rem` to the right of the content start;
   - it stays in view while scrolling;
   - the first `h2` of `/ru/platform/runtime/` is above 900 px.
2. At 1440, on `/ru/platform/` and `/en/platform/`, the bottom of the third layer row is above 900 px.
3. No `.version-context` or `.chapter-reference` descendant computes to PT Mono. The version reads "1.6.1" with no
   gaps.
4. At 1440, documentation `h2` computes to 32 px, `h1` to 56 px, the home `h1` to 72 px.
5. Header: the visible gaps between consecutive navigation labels differ by at most 2 px; the header block size is
   68 px at 390 px and 1440 px.
6. At 390 × 844, the home primary action is inside the first viewport.
7. No page shows "Пределы" followed by "Предел." or "Limits" followed by "Limit.".
8. English pages show "October 2026" and "Alexey Grigorev, Ivan Oparin" wherever a date or the authors appear,
   and `/en/book/` lists chapter 31 in English.
9. The existing gates still pass: contrast, axe, keyboard journey (skip link, header, drawer including the
   language switch, section index, footer), forced colours, 200 % text zoom with no horizontal scroll, figure
   modes, no-status, names and identifiers.

## 4. Content and data follow-ups

These come out of the audit but are not layout. They belong to the content and code work that implements this
pass.

- Home, both languages:
  - replace the three-layer paragraph with `[[layers]]`;
  - remove the lead sentence that repeats the category;
  - remove the paragraph with the two links.
- `/platform/`, both languages: add `[[layers]]` after the lead.
- `/book/`, both languages: remove the lead sentence that restates the entry metadata.
- `src/data/publications.json`: an English date, and English author spelling for the book and papers ("Alexey
  Grigorev, Ivan Oparin"), selected by page language in the entries, the version line and the footer.
- `src/data/book-chapters.json`: the English title of chapter 31.

## 5. Contract amendments

Exact replacement text for `docs/design-contract.md`. Section numbers refer to that file.

**Section 3, "Home page, first viewport", items 2 and 3**, replace with:

> 2. The page title block: the name "Swarma" as the product statement (`h1`), the literal category from the book
>    subtitle (ch. 00, title page), and the three layer rows (8.14) naming the three layers (ch. 00 "Три слоя
>    Swarma").
> 3. One action row: the primary action link (8.13) "Книга о Swarma" to `/book/`, and on the same row one
>    secondary text link "Открытый код" to `/open-source/`. The home page has no section index and no version
>    context line.

**Section 3, "Platform page, first viewport"**, replace the paragraph with:

> On `/platform/` and each layer page the first viewport shows the header, the page title block with a lead
> paragraph, and the version context line. On `/platform/` the title block also holds the three layer rows (8.14),
> visible without scrolling at 1440 px (ch. 02 "Имена и участники"). At 1024 px and wider the section index is a
> sticky column to the right of the content; below 1024 px it is a native `details` disclosure, closed by default,
> placed after the title block.

**Section 4, "Typography"**, replace "PT Mono for technical text (chapter references, versions, code)" with:

> PT Mono for technical text (code, identifiers, repository names, layer numbers); versions, dates and chapter
> references are set in PT Sans (section 12)

**8.1 Header**, replace the last sentence of "Structure" and the "Tokens and type" item with:

> Inline end: the language switch (8.3). Below the navigation breakpoint the language switch moves into the
> drawer, after the navigation, and the header keeps one row and its height. The header is static (not sticky), so
> it never covers a focused element or an anchor target.
>
> - **Tokens and type:** `--color-bg` (solid, no translucent material), `--color-text`, `--color-link-hover` for
>   hover, `--color-focus`, `--color-divider` for the bottom rule, `--color-scrim` behind the drawer. Navigation
>   links in PT Sans body size, each centred in a target of at least 44 × 44 px, with `--space-6` between items;
>   the language switch in PT Sans compact interface size.

**8.4 Page title block**, replace "Content" and "Tokens and type" with:

> - **Content:** title; lead paragraph; on `/platform/` and the home page the layer rows (8.14); the rest of the
>   introduction with its source line; on documentation pages the version context line with the book version and
>   date from the book metadata. The section index follows the title block (8.15). The block carries no status, no
>   readiness marker and no "by design" disclaimer (section 11).
> - **Tokens and type:** PT Sans 700 at page-heading size (product-statement size only on the home page), PT Serif
>   at lead size, `--color-text`; the version line in PT Sans compact interface size with tabular figures in
>   `--color-text-muted`.

**8.5 Section with chapter reference**, replace "Tokens and type" with:

> - **Tokens and type:** on documentation pages each section is separated from the previous one by a 1 px
>   `--color-divider` rule and `--space-12` above and below it (`--space-8` below 640 px), with no alternating
>   background; on the home page sections alternate full-width `--color-bg` and `--color-surface-subtle` bands with
>   `--layout-section` padding. Section headings in PT Sans 700 (section 12 for the documentation step); body prose
>   in PT Serif; the reference in PT Sans compact interface size in `--color-text-muted`, with `--color-link` for
>   its links.

**8.7 Callout for a guarantee's limits**, add to "Content":

> The heading carries the label; the text that follows does not repeat it.

**New components**, after 8.12:

> ### 8.13 Primary action link
>
> - **Purpose:** the one primary action of the home page.
> - **Content:** a native link with a destination-specific label.
> - **States:** default, hover, focus-visible, pressed.
> - **Keyboard and screen reader:** a native link; no `role="button"`.
> - **Tokens and type:** PT Sans 700 at body size, `--color-on-strong-action` on `--color-strong-action`
>   (`--color-strong-action-hover` on hover), `--radius-control`, `--space-3` by `--space-6` padding, at least 44 px
>   tall; `--color-focus` outline; a 1 px `ButtonText` border in forced colours.
>
> ### 8.14 Layer rows
>
> - **Purpose:** the three layers with one line each, in the fixed order Runtime, Protocol, Chain.
> - **Content:** per row the layer number in the technical face, the layer name as a link to its page, and one
>   sentence from ch. 00 "Три слоя Swarma"; the same component, as a description list, holds the per-layer rows of
>   `/principles/`.
> - **States:** link hover and focus-visible.
> - **Keyboard and screen reader:** an ordered list (a description list on `/principles/`); the link text is the
>   layer name.
> - **Tokens and type:** rows separated by 1 px `--color-divider` with `--space-4` padding; the number in PT Mono
>   at technical size in `--color-text-muted`; the name in PT Sans 700 at subsection size in `--color-link`; the
>   sentence in PT Sans body size; one column below 640 px.
>
> ### 8.15 Section index
>
> - **Purpose:** on-page navigation of a documentation page.
> - **Placement:** at 1024 px and wider, a sticky column of 15rem to the right of the 45rem content column, with
>   `--space-16` between them; below 1024 px, a native `details` disclosure after the title block, closed by
>   default.
> - **Keyboard and screen reader:** a `nav` with an accessible name; native links in heading order; at least
>   44 px targets.
> - **Tokens and type:** in the column, PT Sans compact interface size in `--color-text-muted` with a 1 px
>   `--color-divider` rail; in the disclosure, PT Sans body size in `--color-link`.

**Section 9**:

- In the `/ru/` outline, item 1, replace "one paragraph with the three layers (ch. 00 "Три слоя Swarma")" with
  "the three layer rows (8.14, ch. 00 "Три слоя Swarma")".
- In the `/ru/platform/` outline, item 1, append "; the three layer rows (8.14)".

**Section 12**, add two rows:

> | Documentation section headings at 2rem on desktop | The fixed scale sets section headings at 2.75rem on desktop | Documentation pages carry 8 to 14 sections; at 2.75rem against a 3.5rem page heading the hierarchy reads flat. The value is the scale's own mobile section step |
> | Versions, dates and chapter references in PT Sans | The technical role sets versions and chapter references in PT Mono | PT Mono's full-cell period makes "1.6.1" read as spaced digits, and references in mono read as code; PT Sans with tabular figures keeps them precise and readable |
