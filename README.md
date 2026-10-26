# Swarma site

The static website of the Swarma platform, built with Astro and plain CSS.
Russian pages come first; an English route exists only when its Markdown file exists.
The current pages are preparation notices, with the book's layer map on the status page.

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
`npm run check` runs the checks' positive and planted negative controls, builds the site,
then checks both source and output. CI runs the same command with Node 22.

Pages live in `src/content/pages/ru/` and `src/content/pages/en/`.
Each Markdown page needs `title`, `description`, numeric `order` and boolean `nav` frontmatter.
The file path determines its slug: `index.md` is the locale home, and nested files retain
nested routes. Navigation follows `order`; the language switch lists only existing counterparts.
The static root page lists only locales with a home page, Russian first.
On a translated page without a locale home, the wordmark links to the root selector;
it links to the locale home once that file exists.

## Status data

Status text comes only from the vendored layer-map table of the Swarma book, version 1.6.1,
chapter 29, through generated JSON and the provenance-marked `StatusTable` and `StatusRow` components.
The check rejects stale JSON, changed row order or count, and availability claims in authored
content or rendered prose outside the marked table.

The source table is `src/data/status/source/layer-map.book-1.6.1.ru.md`.
`src/data/status/row-ids.json` binds stable slugs to exact capability cells in table order.
After an intentional source update, run `npm run status:generate`, review the source,
mapping and JSON together, then run `npm run check:status-data`.
The source's inline Markdown notation remains literal in generated cell strings.

## Checks

| Command | Claim checked | Output |
| --- | --- | --- |
| `npm test` | Clean controls pass; planted violations fail for the intended diagnostic | Console; isolated fixtures in `.temp/check-fixtures/` are removed after each test |
| `npm run check:publication-surface` | Only supported HTML publication features occur in source and output | Console; nonzero on a violation |
| `npm run check:identifiers` | Publication files contain no prohibited identifiers, paths, session links, unlisted repository links or emails | Console; nonzero on a violation |
| `npm run check:status-language` | Page prose contains no availability claims outside rendered book status regions | Console; nonzero on a violation |
| `npm run check:names` | Publication files use canonical names and avoid prohibited metaphors | Console; nonzero on a violation |
| `npm run check:i18n` | Metadata is complete, slugs are canonical and every English page has a Russian counterpart | Console; nonzero on a violation |
| `npm run check:status-data` | Generated JSON matches the vendored table and ordered mapping | Console; read-only |
| `npm run status:generate` | Regenerate JSON after a reviewed source change | `src/data/status/layer-map.ru.json` |

Identifier and name checks scan `src/`, `public/`, `docs/`, `README.md`, `dist/` and
`scripts/`. The only generic-rule policy-code exclusions are `scripts/checks/identifier-rules.mjs`,
`scripts/checks/names.mjs` and `scripts/checks/tests/`, which contain generic patterns,
the names policy and isolated synthetic violations. No publication directory is excluded.
`config/public-repos.json` holds exact repository-name and email allowlists, both initially empty.
The tracked identifier policies and test controls contain only generic shapes and synthetic values.
Real internal names are supplied outside the repository through `IDENT_DENY_TOKENS`
(comma-separated literals), or the untracked local file `$HOME/.config/swarma-site/deny-tokens.txt`
(one literal per line; commas are also accepted). A nonempty environment list takes precedence.
Matches are case-insensitive literal substrings; diagnostics name the rule and redact matching filenames.
Both raw source and decoded publication values receive the generic and external-token checks. JSON keys and
string values are parsed, including Unicode escapes. CSS decoding covers character escapes, escaped string
newlines, adjacent generated-content strings and URL targets. HTML/SVG text and attributes decode entities;
embedded style elements and attributes receive CSS decoding. Markdown entities and link targets are decoded
outside code spans/fences. Raw code examples remain subject to identifier rules. URL targets also receive
percent decoding. Entity-looking text in JSON/CSS strings is not recursively HTML-decoded.

Malformed JSON and CSS lexical input fail with `publication-decode`. SVG custom entity declarations/DTDs are
rejected by that rule because the HTML parser does not implement XML DTD expansion. The scanner uses static
format-specific decoding; it does not execute JavaScript or arbitrary application transformations.
Configuration parse failures return `identifier-allowlist`; external-source read failures return
`identifier-deny-tokens`; file/traversal failures return `identifier-scan`. These fixed diagnostics and the
identifier CLI fallback never print underlying exception messages or file contents. Normal findings pass through
the same configured-token redaction. The allowlist requires arrays of strings for both fields.
External tokens scan all repository files, including policy sources, tests, configuration and CI files,
without the generic-rule exemptions. Only Git metadata, dependency directories, local context and generated
scratch/cache directories (`.temp/`, `.astro/`, `.val/`) are omitted; built `dist/` files remain checked.
Never add real tokens to source, fixtures, documentation, command arguments or logs.

Set the repository secret `IDENT_DENY_TOKENS` before running CI; the workflow passes it to the check job.
CI fails when neither source supplies a nonempty list, even if `IDENT_DENY_TOKENS_OPTIONAL=1`.
Locally, missing tokens print a warning and run generic checks, but still exit nonzero.
Only an explicit local `IDENT_DENY_TOKENS_OPTIONAL=1 npm run check` permits a generic-only pass.
The isolated controls inject synthetic lists and temporary home directories; they do not need the real list.
They assert safe output for malformed configuration and actual unreadable files, and pair encoded identifier
plants with valid controls in source and output. Real Astro builds verify that encoded public files reach `dist/`
and are rejected there, alongside clean public-to-dist controls.

Status-language checks inspect all authored content and decoded rendered HTML text;
the source marker alone grants no exemption. Each marked DOM table is compared with
the complete expected table from canonical JSON; each marked row is compared by
`data-status-row` with its expected ID, four exact cell strings, element structure and attributes.
Changed cells, extra descendants or attributes, unknown IDs and arbitrary marked prose fail
`status-provenance`. Literal markers in `src/` or `public/` outside `StatusTable.astro` and `StatusRow.astro`
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

The names policy follows book 1.6.1: `Swarma Signer` is canonical and passes;
the retired `Swarm` prefix remains forbidden for the signer and the other product names.

## Tools

| Tool | Purpose and entry point | Outputs |
| --- | --- | --- |
| Node.js and npm | Install with `npm ci`; execute scripts with `npm run check` | `node_modules/`, console diagnostics |
| Astro | Local preview with `npm run dev`; static generation with `npm run build` | `.astro/`, `dist/` |
| Node test runner | Check controls with `npm test` | Console; temporary isolated fixtures |
| Zod | Shared metadata validation, used by Astro and `npm run check:i18n` | Collection errors and console diagnostics |
| gray-matter | Parse Markdown frontmatter through `npm run check:i18n` | In-memory metadata |
| parse5 | Parse HTML through `npm run check:publication-surface`, identifier, name and status-language checks | In-memory DOM, decoded attributes and text |
| GitHub Actions | The `check` job on pull requests and main pushes; runs `npm ci` and `npm run check` | Hosted check logs |

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

No deployment workflow is included. See `docs/design-contract.md` for the minimal design
contract and the separate browser and assistive technology release validation scope.
