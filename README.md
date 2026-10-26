# Swarma site

The static website of the Swarma platform, built with Astro and plain CSS.
Russian pages come first; an English route exists only when its Markdown file exists.
The content collection supplies page prose. The shared layout implements the Swarma design system,
with book-sourced status tables and publication conventions.

## Development

Use Node 22.23.4 or newer and npm. Dependencies are pinned in `package-lock.json`.

```sh
npm ci
npm run dev
npm run build
npm run check
```

`npm run dev` starts the local development server; stop it when finished.
`npm run build` writes static HTML and assets to `dist/`.
Its `prebuild` gate rejects invalid localization metadata and stale or inconsistent status data.
Configuration loading also rejects prohibited identifiers and names in every vendored status source.
`npm run check` runs the checks' positive and planted negative controls, builds the site,
then checks both source and output. CI runs the same command on self-hosted Linux x64 runners with Node 22 already on PATH.
The job asserts the Node major version and installs Chromium for browser checks before running the checks.

Pages live in `src/content/pages/ru/` and `src/content/pages/en/`.
Each Markdown page needs `title`, `description`, numeric `order` and boolean `nav` frontmatter.
The file path determines its slug: `index.md` is the locale home, and nested files retain
nested routes. Navigation follows `order`; the language switch appears only when another counterpart exists.
The static root page lists only locales with a home page, Russian first.
On a translated page without a locale home, the wordmark links to the root selector;
it links to the locale home once that file exists.

## Status data

Status text comes only from the vendored layer map, vocabulary and complete part tables of book
1.6.1, printed chapter 30. Provenance-marked tables and rows render their literal cell strings.
The check rejects stale JSON, changed row order or count, and availability claims in authored
content or rendered prose outside the marked table.

The source tables are `src/data/status/source/layer-map.book-1.6.1.ru.md` and
`src/data/status/source/parts.book-1.6.1.ru.md`. Part rows retain their section and ordered stable
key in `part-ids.json`; vocabulary is generated separately. No source section is excluded.
`src/data/status/row-ids.json` binds stable slugs to exact capability cells in table order.
After an intentional source update, run `npm run status:generate`, review the source,
mapping and JSON together, then run `npm run check:status-data`.
The source's inline Markdown notation remains literal in generated cell strings.

## Checks

| Command | Claim checked | Output |
| --- | --- | --- |
| `npm run check:browser` | Chromium launches and returns actual rendered text; safe diagnostics identify startup problems | Console; transient browser artifacts |
| `node scripts/checks/deny-policy.mjs` | Validate the explicit CI policy without local fallback | Fixed diagnostics; nonzero on invalid configuration |
| `npm test` | Clean controls pass; planted violations fail for the intended diagnostic | Console; isolated fixtures in `.temp/check-fixtures/` are removed after each test |
| `npm run check:publication-surface` | Only supported HTML publication features occur in source and output | Console; nonzero on a violation |
| `npm run check:identifiers` | Publication files contain no prohibited identifiers, paths, session links, unlisted repository links or emails | Console; nonzero on a violation |
| `npm run check:status-language` | Page prose contains no availability claims outside rendered book status regions | Console; nonzero on a violation |
| `npm run check:names` | Publication files use canonical names and avoid prohibited metaphors | Console; nonzero on a violation |
| `npm run check:i18n` | Metadata is complete, slugs are canonical and every English page has a Russian counterpart | Console; nonzero on a violation |
| `npm run check:status-parts` | Part tables and vocabulary match the complete vendored source and mapping | Console; read-only |
| `npm run check:contrast` | All 704 declared foreground/background pairs pass in four palettes | Console; nonzero on failure |
| `npm run check:fonts` | Shipped WOFF2 and OFL files match locked font packages byte for byte | Console; read-only |
| `npm run check:a11y` | Every built route at 390/1440px in light/dark, plus open mobile menus, has no axe violation | `.temp/a11y/` JSON and representative screenshots; server and browser close on completion |
| `npm run check:status-data` | Generated JSON matches the vendored table and ordered mapping | Console; read-only |
| `npm run status:generate` | Regenerate JSON after a reviewed source change | `src/data/status/layer-map.ru.json` |

Identifier and name checks scan `src/`, `public/`, `docs/`, `README.md`, `dist/` and
`scripts/`. The only generic-rule policy-code exclusions are `scripts/checks/identifier-rules.mjs`,
`scripts/checks/names.mjs` and `scripts/checks/tests/`, which contain generic patterns,
the names policy and isolated synthetic violations. No publication directory is excluded.
`config/site.json` and `config/repos.json` supply the exact contact and repository URL allowlists.
The tracked identifier policies and test controls contain only generic shapes and synthetic values.
Real internal names are supplied outside the repository through `IDENT_DENY_TOKENS`
(comma-separated literals), or the untracked local file `$HOME/.config/swarma-site/deny-tokens.txt`
(one literal per line; commas are also accepted). A nonempty environment list takes precedence.
Each token must fully match `[a-z0-9][a-z0-9._-]{2,}` after trimming ASCII whitespace. One invalid entry
or an empty configured file rejects with fixed `identifier-deny-tokens` diagnostics without echoing the value.
Matching folds ASCII uppercase only; Unicode case folding is not performed. Literal substrings match
after Unicode whitespace/separator normalization, including
the separator-free variant. Soft hyphens, U+180E, U+200B–U+200D, U+2060 and U+FEFF are removed for comparison.
Generic identifier, name and availability rules use normalized whitespace without removing word boundaries.
Browser line breaks from `br` and block elements count as whitespace. Diagnostics name the rule and redact
matching original filename spans with the same normalization, including overlapping tokens.
Raw source remains checked, including code examples. Consumer values come from real parsers: JSON keys and
strings from JSON.parse, Markdown from the CommonMark preset of markdown-it, and CSS literals/URLs from css-tree after strict PostCSS syntax validation.
CommonMark handles emphasis, inline code, fenced and indented code, nesting and link destinations; code entities
remain literal. No custom Markdown, HTML or CSS escape parser determines a scanner verdict.

Chromium loads generated HTML with its shipped stylesheets unchanged. The browser supplies DOM innerText,
decoded attributes, accessibility-tree names/descriptions and computed generated content. Local asset interception
blocks external requests and script execution. Styled documents are sampled at 390px and 1440px in light, dark,
increased-contrast and forced-color appearances. Unstyled documents need one equivalent observation.
Percent decoding is applied once to URL values. JSON/CSS strings are never recursively HTML-decoded.
Downloads, traces and browser XDG caches live under .temp/publication-browser/. Playwright manages and removes browser profiles in the caller's OS temporary directory (TMPDIR when supplied); keep that path short for Chromium's Unix socket limit.
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH can select an existing local Chromium executable; CI uses the pinned Playwright
browser installed by the workflow.

Every published SVG is also loaded as a standalone `image/svg+xml` document, including unlinked files.
Chromium's Selection API supplies SVG rendered text and layout line breaks where `innerText` is unavailable.
SVG text, titles, descriptions, decoded attributes and accessible names receive the same identifier, name and
availability policies as inline SVG. Malformed XML fails `publication-decode`; stylesheet source is not prose.

All publication text must be valid UTF-8 without BOM or NUL bytes, including extensionless files. Unsupported
encodings fail publication-decode before interpretation; the publication-surface check also runs before Astro.
Known binary image/font extensions require matching signatures rather than accepting renamed text. Binary payloads
are outside text rendering; attributes and external raw literals remain checked. SVG DTD/entity declarations are
unsupported. Malformed JSON/CSS input also fails publication-decode instead of silently skipping values.
Configuration parse failures return identifier-allowlist; external-source read failures return identifier-deny-tokens;
file/traversal failures return identifier-scan. Shared CLI output redacts configured literals for every check,
including findings from names, availability, publication features, metadata and canonical-data checks. Unexpected
exceptions become fixed diagnostics, never underlying messages, filenames or tracebacks. The allowlist requires
arrays of strings for both fields.
External tokens scan all repository files, including policy sources, tests, configuration and CI files,
without the generic-rule exemptions. Only Git metadata, dependency directories, local context and generated
scratch/cache directories (`.temp/`, `.astro/`, `.val/`) are omitted; built `dist/` files remain checked.
Never add real tokens to source, fixtures, documentation, command arguments or logs.

Set the repository secret `IDENT_DENY_TOKENS` before running CI; the workflow passes it only to the checks step.
That step runs `node scripts/checks/deny-policy.mjs`, requiring a nonempty explicit list using the same ASCII
grammar before running checks. Greek letters, invisible characters, NBSP and uppercase entries reject.
CI never falls back to the local file, even if `IDENT_DENY_TOKENS_OPTIONAL=1`.
Locally, missing tokens print a warning and run generic checks, but still exit nonzero.
Only an explicit local `IDENT_DENY_TOKENS_OPTIONAL=1 npm run check` permits a generic-only pass.
The isolated controls inject synthetic lists and temporary home directories; they do not need the real list.
They assert safe output for malformed configuration and actual unreadable files, and pair encoded identifier
plants with valid controls in source and output. Real Astro builds verify that encoded public files reach `dist/`
and are rejected there, alongside clean public-to-dist controls.

Status-language checks inspect all authored content, decoded rendered HTML text and public/built SVG documents;
the source marker alone grants no exemption. Each marked DOM table is compared with
the expected table from canonical JSON, with exact source captions and headers; full tables retain
source order and excerpts retain their selected keys. Each marked row is compared by
`data-status-row` with its expected ID, literal cells, element structure, attributes and permitted
one-word status chip. No other cell can gain a chip.
Changed cells, extra descendants or attributes, unknown IDs and arbitrary marked prose fail
`status-provenance`. Literal markers in `src/` or `public/` outside `StatusTable.astro`, `StatusRow.astro` and `src/lib/status-render.mjs`
fail `status-marker-location`. Only verified DOM regions are omitted from the prose check.
Decoded attributes are always checked for identifiers, including links, image sources,
source sets and metadata. Decoded `alt`, `aria-label`, `aria-description`, `title` and
meta `content` also enter name and status-language checks, including inside marked regions.
All checks must be rerun after a build to inspect the current output; `npm run check` does this automatically.

### Supported publication surface

`check:publication-surface` parses every component, layout and page source (`.astro`, `.html`,
`.htm`, `.md`, `.mdx`, JavaScript/TypeScript variants, `.vue`, `.svelte`, `.svg`), all `public/` files and all
built `dist/` files. Astro and Markdown frontmatter is omitted from the source HTML parse;
its rendered output is checked separately. Both scripting modes are inspected, including
template contents. Unsupported containers fail regardless of their text, attributes or
status markers, so nested documents and native form controls cannot bypass the text policies.

The denied features and exact diagnostics are:

- `form`, `input`, `textarea`, `select`: `publication-form`, `publication-input`, `publication-textarea`, `publication-select`.
- A `button` with any `value` attribute, including an empty value: `publication-button-value`.
- `iframe` (including `srcdoc`), `object`, `embed`: `publication-iframe`, `publication-object`, `publication-embed`.
- `noscript`, `template`: `publication-noscript`, `publication-template`.
- Inline attributes beginning with `on`: `publication-event-handler`.
- `javascript:` URLs, including entity-encoded and ASCII-whitespace variants: `publication-javascript-url`.
- `data:` URLs whose media type is not `image/*`: `publication-data-url`.
- `<meta http-equiv="refresh">`: `publication-meta-refresh`.

`config/publication-surface.json` is the single exception list. It is empty: the static
build needs none of these features. Each future exception must specify an exact `path`,
one `rule` and a nonempty `reason`; wildcards and duplicate entries fail `publication-config`.
An exception applies to only that file and rule, so source and output need separate justification.
A future sign-up form requires its own entries and checks for the text and behavior it introduces.
The check conservatively rejects URL schemes found in decoded attributes, including style and source-set values.

Canonical platform names follow book 1.6.1. Refer to the signer as подписант or signer;
the retired product prefix and prohibited metaphors remain covered by the names policy.

## Tools

| Tool | Purpose and entry point | Outputs |
| --- | --- | --- |
| Node.js and npm | Install with `npm ci`; execute scripts with `npm run check` | `node_modules/`, console diagnostics |
| Astro | Local preview with `npm run dev`; static generation with `npm run build` | `.astro/`, `dist/` |
| Node test runner | Check controls with `npm test` | Console; temporary isolated fixtures |
| Zod | Shared metadata validation, used by Astro and `npm run check:i18n` | Collection errors and console diagnostics |
| gray-matter | Parse Markdown frontmatter through `npm run check:i18n` | In-memory metadata |
| parse5 | Standards-based structural HTML validation for publication features and canonical book-region provenance | In-memory DOM |
| markdown-it | CommonMark rendering used by scanner commands | In-memory HTML, then Chromium observations |
| css-tree and PostCSS | Validate CSS syntax, then parse literals and URLs through scanner commands | In-memory syntax trees; no custom escape grammar |
| Playwright and Chromium | Render publication values through identifier, name and status-language commands | Downloads/traces under `.temp/publication-browser/`; profiles in caller OS temp; no external requests |
| GitHub Actions | The `check` job on pull requests and main pushes; runs `npm ci` and `npm run check` | Hosted check logs |

### Scanner threat model

The checks prevent accidental publication by ordinary authors: prohibited identifiers and names, internal paths,
private links and unsupported availability claims in text, code, attributes and common encodings. Deliberately
obfuscating authors are outside this model. Rendered values are taken from Chromium, CommonMark and library syntax
parsers, never a custom markup grammar; CSS colors, when evaluated, must come from getComputedStyle. This branch
has no numeric color-contrast gate.

The publication-feature denylist remains enforced. Text is UTF-8 without BOM; every diagnostic path is redacted.
Each affected rule has a clean control beside a known violation, asserting its intended diagnostic and safe output.
The controls cover malformed/unreadable inputs, source and output encodings, Markdown emphasis and all code forms,
generated browser text, and real Astro public-to-dist copies. They establish these bounded contracts, not resistance
to arbitrary program transformations or comprehensive accessibility conformance.

### Status-language patterns

Patterns are case-insensitive. Russian matches use Unicode letter/number boundaries;
phrase spacing accepts whitespace. The work and availability patterns accept the time
word on either side of the inflected word.

- `работ(?:аю|аешь|ает|аем|аете|ают|ал[аои]?)`: present person/plural and past gender/plural, adjacent to `сегодня` or `уже`.
- `доступ(?:ен|н(?:а|о|ы|ый|ая|ое|ые|ого|ой|ым|ых|ую|ому|ыми))`: short and adjective forms, adjacent to `сейчас` or `уже`.
- `запущ[а-яё]*`: launch stem, including gender/plural forms and both е/ё spellings.
- `выпущ[а-яё]*`: release stem, including gender/plural forms and both е/ё spellings.
- `в\s+продакшене`: production phrase.
- `готов(?:а|о|ы|ый|ая|ое|ые|ого|ой|ым|ых|ую|ому|ыми)?\s+к\s+использованию`: readiness adjectives with the required phrase; neutral `готовность` is not an availability adjective.
- `works today`, `available now`, `generally available`, `in production`, `ready to use`, `now live`, `launched`, `shipping now`: English whole-word phrases.

Neutral `запуск агента`, `готовность`, `готовность к использованию` and `доступ к носителю`
pass. The test suite probes the inflected forms in authored and rendered prose, decoded
accessible attributes, and real builds with forged status markers and partial translations.

No deployment workflow is included. See `docs/design-contract.md` for the design
contract and `UNRESOLVED_QUESTIONS.md` for remaining publication and assistive-technology gates.

## Markdown conventions

Page files stay plain Markdown. Second- and third-level headings form the outline; the section index
uses second-level headings. The title, lead, fixed design frame and version context share one layout.
Ordinary Markdown tables keep their native table markup inside a labelled, keyboard-focusable scroll region.

- A standalone paragraph beginning exactly `Источник: ` (or `Source: `) contains references separated
  by `; `. Each reference is `глава NN "Chapter title"`, optionally followed by
  `, раздел "Section title"`. Names and printed numbers must match `src/data/book-chapters.json`;
  mismatches fail the build with the file and line. English syntax is `chapter NN "Chapter title"`,
  optionally `, section "Section title"`, checked against the approved `title_en` and section `en`
  translations. Links resolve to the matching locale's `/book/#chNN` anchor. Source-only headings
  without a supplied English translation remain Russian catalog entries and cannot validate an
  invented English title.
- A blockquote whose first child starts with `**Предел.**` (or `**Limit.**`) becomes a named limits
  aside. Other blockquotes remain ordinary quotes.
- `status_rows: [swarma, part-002]` in frontmatter plus a standalone `[[status]]` selects exact source
  rows. `status_table: full` plus that marker renders all tables and vocabulary. Unknown keys,
  missing data, duplicate markers and unused data fail the build. Do not put status prose in content.
- A standalone `[[figure three-layers]]`, `[[figure protocol-topology]]` or `[[figure sublayers]]`
  uses `src/data/figures.json`. Default builds render nothing for these markers. Private builds use
  `SWARMA_BOOK_FIGURES=1 npm run check`, preserving the source SVG, caption, alternative and printed
  chapter reference. Private and default content stores are separate under `.temp/astro-cache/`;
  their revision includes renderer code and data so configuration changes cannot reuse stale Markdown links.
- `[[repos]]` renders the configured repository rows with localised descriptions from
  `src/lib/repository-descriptions.mjs`, native repository links and the canonical status component.
  Empty status selections render no status; unknown selected IDs fail. English status tables have
  English column headings and provenance captions, with Russian source cells marked `lang="ru"`.
- `[[publications book]]` or `[[publications papers]]` renders the publication metadata and excerpt
  from `src/data/publications.json`. PDF placeholders are text; they cannot download a file.

The tokens, contrast checker and operator artwork derive from the pinned Swarma Platform Design
System; its MIT notice is preserved in `docs/licenses/design-system-MIT.txt`. The font OFL files
are beside their WOFF2 files. Book SVGs are kept only for the explicitly switched private rendering;
publishing those diagrams and the PDFs requires the owner's decision.
