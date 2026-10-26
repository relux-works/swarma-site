# Swarma site

The static Swarma website uses Astro and plain CSS. Russian pages come first; an English route
exists only when its Markdown file exists. The site describes the platform and its guarantees
and limits. Delivery status remains in the book and is never reproduced on the site.

## Development

Use Node 22.23.4 or newer, npm, Python 3.12 and installed Google Chrome. Dependencies are pinned.

```sh
npm ci
npm run dev
npm run build
npm run check
```

Stop the development server when finished. Builds write to `dist/`; checks and browser reports
write to `.temp/`. `prebuild` rejects obsolete status conventions, invalid localization metadata
and changed brand assets. `postbuild` rejects public book diagrams and rendered status UI.
CI runs the complete check command on self-hosted Linux with Node 22 and Python 3 in both figure modes.
The existing install step provides pinned Playwright Chromium; local runs may select an installed browser.

Pages live in `src/content/pages/ru/` and `src/content/pages/en/`. Each requires `title`,
`description`, numeric `order` and boolean `nav`. The path determines the slug; `index.md` is the
locale home. Navigation follows `order`. The language switch appears only for existing counterparts.
The root selector lists locales with a home page, Russian first. A translated page without its
locale home links the product identity to the root selector.

## Tools and checks

| Tool / command | Claim or purpose | Output |
| --- | --- | --- |
| Astro: `npm run build` | Static pages compile with validated conventions and publication gates | `dist/`, `.temp/astro-cache/` |
| Astro: `npm run dev` | Local authoring preview; stop after use | Local foreground server |
| npm: `npm ci` | Install the lockfile versions | `node_modules/` |
| Node: `npm test` | Positive fixtures pass; bounded violations fail for their intended reasons | Console, `.temp/*-evidence.json`; fixtures are removed |
| `npm run check` | Complete local validation sequence | Console and `.temp/` reports |
| `npm run check:no-status` | No status route, marker, keys, chips, provenance attributes or status links | Console |
| `npm run check:status-language` | No availability claims in authored or rendered text or accessible labels; no exemptions | Console |
| `npm run check:names` | Canonical names and no infrastructure product names in site content | Console |
| `npm run check:i18n` | Valid metadata, canonical slugs and Russian counterpart for every English page | Console |
| `npm run check:identifiers` | No private identifiers, paths or unconfigured repository links/contact values | Console |
| parse5: `npm run check:publication-surface` | Only supported publication HTML features in source/output | Console |
| `npm run check:brand` | Copied artwork bytes match the pinned owner's manifest | Console |
| `npm run check:fonts` | Licensed local font assets match their manifest | Console |
| Python / Chromium: `npm run check:contrast` | Effective built CSS passes 2816 numeric token pairs across 16 appearances, including forced colors and reduced transparency | `.temp/contrast/report.json` |
| Python: `python3 -B scripts/check_contrast.py src/styles/tokens.css` | Chromium resolves the copied tokens; 2816 numeric pairs and forced system-color roles | Console |
| Python: `python3 -B scripts/check_contrast.py src/styles/tokens.css --control` | Known low-contrast control must fail | Console; exit 1 |
| `npm run check:figures` | With figures off, no copied, inline, base64, geometry or hash representation of a book SVG reaches output | Console |
| Playwright / axe: `npm run check:a11y` | Every built route in light/dark, desktop/mobile and open drawer; overflow and focus contract | `.temp/a11y/report.json`, screenshots |
| Playwright: `npm run check:header` | Header boxes do not overlap at each integer width 320–1920 with 16px and 32px root text; enlarged-text keyboard journeys | `.temp/a11y/geometry.json` |
| `node scripts/checks/a11y.mjs --matrix` | Extended appearance/width checks | `.temp/a11y/matrix.json` |
| `node scripts/checks/a11y.mjs --control` | Missing-alt witness must fail with `image-alt` | `.temp/a11y/control.json` |

## Publication policy

`config/site.json` defines the GitHub organization and contact email. `config/repos.json` defines
13 repository names and description keys. Exact full URLs and the contact email derive from that
configuration. Prefixes, other organizations, suffixes, queries and unconfigured addresses fail.
Repository entries contain name, book-grounded bilingual description and link only.

The availability check rejects the documented phrases and Russian person/gender/plural forms:
work today/already, available now/already, launch/release statements, in production, ready to use,
works today, available now, generally available, now live, launched and shipping now. Neutral book
terms such as agent launch, readiness and access remain valid. Decoded rendered text and accessible
attributes are checked; a source-looking marker grants no exemption.

The documented infrastructure product list lives in `scripts/checks/names.mjs`. It covers message
servers/clients, VPN, hosting, peer-to-peer transport and virtualization/container products. Site
content names the role instead. Claude Code and Codex are allowed harness names. SSH and Xcode
remain the book's terms. The policy declaration and its test controls are outside publication scans.

HTML publication checks reject nested documents, SVG scripting, templates, forms, hidden fallback
content and unsupported browser surfaces. Immutable font and owner-brand binary exemptions apply
only after exact SHA-256 verification. Changed bytes cannot obtain an exemption.

## Content conventions

- Level-two headings produce a section index; level-three headings receive stable anchors.
- A standalone `Источник: глава NN "Title", раздел "Section"` validates the printed Russian catalog.
  English uses `Source: chapter NN "Title", section "Section"` and the translated catalog fields.
  Separate references with `; `. Invalid numbers, titles, sections and grammar fail the build.
- A blockquote beginning `**Предел.**` or `**Limit.**` becomes a named limits aside. Ordinary quotes
  stay quotes. Ordinary tables have a named keyboard-scroll region.
- `[[figure three-layers]]`, `[[figure protocol-topology]]` and `[[figure sublayers]]` select original
  book artwork. The default emits none. `SWARMA_BOOK_FIGURES=1 npm run check` permits private
  inspection; it does not authorize public diagram publication. Unknown names fail in both modes.
  The output gate covers assets copied through public folders and imports as well as markup.
- `[[publications book]]` and `[[publications papers]]` render source metadata and abstracts. No PDF
  is copied or linked before the publication decision.
- `[[repos]]` renders configured repository entries. Unknown descriptions fail.
- Legacy delivery-state keys, markers and routes are forbidden. They are not content conventions.

Build diagnostics use `src/lib/diagnostics.mjs`: configured values from `IDENT_DENY_TOKENS` or the
untracked local policy file are replaced case-insensitively before output. Convention errors are
redacted at creation; Astro and check entry points also filter both streams so framework paths,
frames and split writes cannot echo a configured value. An unreadable policy stops output with a
fixed diagnostic. Uncaught exceptions and rejected promises terminate with a fixed failure message,
bypassing Node's raw source-frame formatter. Expected failures retain safe rule identifiers and locations.

Markdown rendering caches include renderer, diagnostics, configuration, catalog and figure hashes and separate
figure-on/off stores. A configuration move or flag change cannot reuse stale private markup.

## Identity and provenance

The header uses the original Swarma horizontal lockup, with a dark `picture` source, accessible home
link and 160px image minimum. Its additional 6px padding exceeds the 12-master-unit clear-space
requirement at that scale. Navigation collapses according to measured content width and font size;
when the product and service controls cannot share a row, the collapsed header wraps.
Favicons, Apple touch and manifest icons are the supplied exports. The product artwork is never
retyped, filtered or recolored. `src/data/brand-assets.json` records the source repository,
revision and unchanged entries of its `assets/manifest.json`.

The owner artwork comes from `relux-works/swarma-brand-assets` at `e750345`. Tokens are an exact
versioned copy from the Swarma Platform Design System at `d39d98efb898fa2609bed4d48c83edb85d02b349`;
unchanged operator artwork remains from `4eeab5c`. Pair selection, forced-color roles, luminance and
alpha compositing are adapted from the same token revision. Chromium resolves the complete built
stylesheet in all 16 appearance combinations. The former handwritten CSS evaluator is removed.
Forced-color roles are compared with browser-resolved system colors; their numerical foreground /
background pairs pass the same targets after alpha compositing. Pressed buttons use
`--color-control-text-pressed` over `--color-control-pressed`, including HighlightText over Highlight.
In forced colors, these system-colored buttons suppress automatic adjustment so Chromium does not
paint a Canvas text backplate over the pressed label. Other interface elements retain normal adjustment.

Fonts are local PT Sans, PT Serif and PT Mono from Fontsource 5.3.0 with original OFL files.
The reading/UI/technical roles and operator footer preserve the shared design system.
Source publication metadata and private figures use book 1.6.1. Printed chapters begin at 00;
carrier admission is 08, agent launch is 09, and subsequent source filenames lag printed numbers.

Automated browser checks do not establish WCAG conformance. Real operating-system assistive
technology journeys, final authored-content integration and public release decisions remain
separate gates; see `UNRESOLVED_QUESTIONS.md`.

## Structural publication consumers
