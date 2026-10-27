# Swarma site

The static Swarma website uses Astro and plain CSS. Russian pages come first; an English route
exists only when its Markdown file exists. The site describes the platform and its guarantees
and limits. Delivery status remains in the book and is never reproduced on the site.

## Development

Use Node 22.23.4 or newer, npm, Python 3.12 and installed Google Chrome. Dependencies are pinned.

```sh
node scripts/run.mjs npm ci
node scripts/run.mjs npm run dev
node scripts/run.mjs npm run build
node scripts/run.mjs npm run check
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
| Astro: `node scripts/run.mjs npm run build` | Static pages compile with validated conventions and publication gates | `dist/`, `.temp/astro-cache/` |
| Astro: `node scripts/run.mjs npm run dev` | Local authoring preview; stop after use | Local foreground server |
| npm: `node scripts/run.mjs npm ci` | Install the lockfile versions | `node_modules/` |
| Node: `node scripts/run.mjs npm test` (four concurrent files) | Positive fixtures pass; bounded violations fail for their intended reasons | Console, `.temp/*-evidence.json`; fixtures are removed |
| `node scripts/run.mjs npm run check` | Complete local validation sequence | Console and `.temp/` reports |
| `node scripts/run.mjs npm run check:no-status` | No status routes, markers, keys or links; Chromium rejects status classes/data attributes in HTML, Markdown and standalone SVG | Console |
| `node scripts/run.mjs npm run check:status-language` | No availability claims in authored or rendered text or accessible labels; no exemptions | Console |
| `node scripts/run.mjs npm run check:names` | Canonical names and no infrastructure product names in site content | Console |
| `node scripts/run.mjs npm run check:i18n` | Valid metadata, canonical slugs and Russian counterpart for every English page | Console |
| `node scripts/run.mjs npm run check:identifiers` | No private identifiers, paths or unconfigured repository links/contact values | Console |
| `node scripts/run.mjs npm run check:browser` | Shared real Chromium startup and rendered-text control, with safe diagnostics | Console; transient browser scratch |
| markdown-it / PostCSS / css-tree | CommonMark rendering and library CSS syntax/literal extraction for publication consumers | In-memory values |
| parse5: `node scripts/run.mjs npm run check:publication-surface` | Only supported publication HTML features in source/output | Console |
| `node scripts/run.mjs npm run check:brand` | Copied artwork bytes match the pinned owner's manifest | Console |
| `node scripts/run.mjs npm run check:fonts` | Licensed local font assets match their manifest | Console |
| Python / Chromium: `node scripts/run.mjs npm run check:contrast` | Every built screen document passes 2816 numeric token pairs across 16 appearances, including forced colors and reduced transparency | `.temp/contrast/report.json` |
| Python: `node scripts/run.mjs python3 -B scripts/check_contrast.py src/styles/tokens.css` | Chromium resolves the copied tokens; 2816 numeric pairs and forced system-color roles | Console |
| Python: `node scripts/run.mjs python3 -B scripts/check_contrast.py src/styles/tokens.css --control` | Known low-contrast control must fail | Console; exit 1 |
| `node scripts/run.mjs npm run check:figures` | With figures off, no copied, inline, base64, geometry or hash representation of a book SVG reaches output | Console |
| Playwright / axe: `node scripts/run.mjs npm run check:a11y` | Every built route in light/dark, desktop/mobile and open drawer; overflow, focus and header alignment to the root layout box | `.temp/a11y/report.json`, screenshots |
| Playwright: `node scripts/run.mjs npm run check:header` | Header boxes do not overlap at each integer width 320–1920 with 16px and 32px root text; enlarged-text keyboard journeys | `.temp/a11y/geometry.json` |
| `node scripts/run.mjs node scripts/checks/a11y.mjs --matrix` | Extended appearance/width checks | `.temp/a11y/matrix.json` |
| `node scripts/run.mjs node scripts/checks/a11y.mjs --control` | Missing-alt witness must fail with `image-alt` | `.temp/a11y/control.json` |

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
content and unsupported browser surfaces. The text reader validates explicit binary signatures. Independent font and owner-brand integrity gates
require exact SHA-256 matches; changed shipped assets fail those gates.

## Content conventions

- Level-two headings produce a section index; level-three headings receive stable anchors.
- A standalone `Источник: глава NN "Title", раздел "Section"` validates the printed Russian catalog.
  English uses `Source: chapter NN "Title", section "Section"` and the translated catalog fields.
  Separate references with `; `. Invalid numbers, titles, sections and grammar fail the build.
- A blockquote beginning `**Предел.**` or `**Limit.**` becomes a named limits aside. Ordinary quotes
  stay quotes. Ordinary tables have a named keyboard-scroll region.
- `[[figure three-layers]]`, `[[figure protocol-topology]]` and `[[figure sublayers]]` select original
  book artwork. The default emits none. `SWARMA_BOOK_FIGURES=1 node scripts/run.mjs npm run check` permits private
  inspection; it does not authorize public diagram publication. Unknown names fail in both modes.
  The output gate covers assets copied through public folders and imports as well as markup.
- `[[publications book]]` and `[[publications papers]]` render source metadata and abstracts. No PDF
  is copied or linked before the publication decision.
- `[[repos]]` renders configured repository entries. Unknown descriptions fail.
- Legacy delivery-state keys, markers and routes are forbidden. They are not content conventions.

Start every documented command through the outer `scripts/run.mjs` supervisor, including npm.
It redacts npm bootstrap errors and lifecycle argument echoes before they reach output. Inner
npm-script supervisors provide additional protection after npm starts. To run Astro directly:

```sh
node scripts/run.mjs node node_modules/astro/bin/astro.mjs build
```

Use `node scripts/run.mjs node scripts/checks/<checker>.mjs` for a direct Node checker.
The documented Python CLIs enter this supervisor before importing checker code or parsing
arguments. The parent filters stdout and stderr line by line, including unterminated tails,
and preserves child exit codes. Policy/bootstrap failures stop with a fixed safe diagnostic.
Provide deny tokens through the environment or the untracked policy file, never command arguments.
Leaf npm scripts forward options as an argument array, without interpreting shell metacharacters:

```sh
node scripts/run.mjs npm run build -- --help
node scripts/run.mjs npm run check:contrast -- --control
```

Compound commands (`check`, `test`, `prebuild`, `postbuild`) accept no extra options. Use the named
leaf checker for a control or help option. The internal `--shell` form accepts one fixed command
string and rejects additional arguments; forwarded values never become shell source.

The contrast gate loads every built HTML document unchanged in Chromium screen media, with
local resources routed at their original URLs. The browser decides stylesheet media, order,
relative imports and base-URL behavior; the gate does not concatenate or reapply stylesheets.
CSS-only controls load an ordinary linked stylesheet fixture.

In-process diagnostics also use `src/lib/diagnostics.mjs`: configured values from `IDENT_DENY_TOKENS` or the
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

The tracked identifier policies and test controls contain only generic shapes and synthetic values.
Real internal names are supplied outside the repository through `IDENT_DENY_TOKENS`
(comma-separated literals), or the untracked local file `$HOME/.config/swarma-site/deny-tokens.txt`
(one literal per line; commas are also accepted). A nonempty environment list takes precedence.
Tokens must match `[a-z0-9][a-z0-9._-]{2,}` after ASCII whitespace trimming. Invalid entries fail;
CI requires the explicit environment list and never reads a local fallback. Comparisons normalize
Unicode whitespace and invisible formatting and use ASCII-only case folding. Standalone SVG documents
receive rendered text, accessible-name and attribute checks, including public-to-dist copies;
malformed XML fails publication-decode. Matches include normalized literal substrings; diagnostics name the rule and redact matching filenames.
Raw source remains checked, including code examples. Consumer values come from real parsers: JSON keys and
strings from JSON.parse, Markdown from the CommonMark preset of markdown-it, and CSS literals/URLs from css-tree after strict PostCSS syntax validation.
CommonMark handles emphasis, inline code, fenced and indented code, nesting and link destinations; code entities
remain literal. No custom Markdown, HTML or CSS escape parser determines a scanner verdict.

Framework templates (Astro, MDX, Vue and Svelte) retain raw-source checks; the scanner does not
interpret their uncompiled syntax as HTML. Their compiled output in `dist/` receives the rendered checks.
Chromium loads generated HTML with its shipped stylesheets unchanged. The browser supplies DOM innerText,
decoded attributes, accessibility-tree names/descriptions and computed generated content. Local asset interception
blocks external requests and script execution. Styled documents are sampled at 390px and 1440px in light, dark,
increased-contrast and forced-color appearances. Unstyled documents need one equivalent observation.
Percent decoding is applied once to URL values. JSON/CSS strings are never recursively HTML-decoded.
Downloads, traces and browser XDG caches live under .temp/publication-browser/. Playwright manages and removes browser profiles in the caller's OS temporary directory (TMPDIR when supplied); keep that path short for Chromium's Unix socket limit.
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH can select an existing local Chromium executable; CI uses the pinned Playwright
browser installed by the workflow.

All publication text must be valid UTF-8 without BOM or NUL bytes, including extensionless files. Unsupported
encodings fail publication-decode before interpretation; the publication-surface check also runs before Astro.
Known binary image/font extensions require matching signatures rather than accepting renamed text. Binary payloads
are outside text rendering; attributes and external raw literals remain checked. SVG DTD/entity declarations are
unsupported. Malformed JSON/CSS input also fails publication-decode instead of silently skipping values.
Configuration parse failures return identifier-allowlist; external-source read failures return identifier-deny-tokens;
file/traversal failures return identifier-scan. Shared CLI output redacts configured literals for every check,
including findings from names, availability, publication features and metadata checks. Unexpected
exceptions become fixed diagnostics, never underlying messages, filenames or tracebacks. The allowlist derives solely from validated site/contact and repository configuration.
External tokens scan all repository files, including policy sources, tests, configuration and CI files,
without the generic-rule exemptions. Only Git metadata, dependency directories, local context and generated
scratch/cache directories (`.temp/`, `.astro/`, `.val/`) are omitted; built `dist/` files remain checked.
Never add real tokens to source, fixtures, documentation, command arguments or logs.

Set the repository secret `IDENT_DENY_TOKENS` before running CI; the workflow passes it to every supervised run step.
That step rejects an empty or delimiter-only secret before running checks, without using a local-file fallback.
CI requires a nonempty repository secret, even if `IDENT_DENY_TOKENS_OPTIONAL=1`.
Locally, missing tokens print a warning and run generic checks, but still exit nonzero.
Only an explicit local `IDENT_DENY_TOKENS_OPTIONAL=1 node scripts/run.mjs npm run check` permits a generic-only pass.
The isolated controls inject synthetic lists and temporary home directories; they do not need the real list.
They assert safe output for malformed configuration and actual unreadable files, and pair encoded identifier
plants with valid controls in source and output. Real Astro builds verify that encoded public files reach `dist/`
and are rejected there, alongside clean public-to-dist controls.


### Scanner threat model

The checks prevent accidental publication by ordinary authors: prohibited identifiers and names, internal paths,
private links and unsupported availability claims in text, code, attributes and common encodings. Deliberately
obfuscating authors are outside this model. Rendered values are taken from Chromium, CommonMark and library syntax
parsers, never a custom markup grammar; CSS colors, when evaluated, must come from getComputedStyle. The contrast gate also uses computed browser colors.

The publication-feature denylist remains enforced. Text is UTF-8 without BOM; every diagnostic path is redacted.
Each affected rule has a clean control beside a known violation, asserting its intended diagnostic and safe output.
The controls cover malformed/unreadable inputs, source and output encodings, Markdown emphasis and all code forms,
generated browser text, and real Astro public-to-dist copies. They establish these bounded contracts, not resistance
to arbitrary program transformations or comprehensive accessibility conformance.
