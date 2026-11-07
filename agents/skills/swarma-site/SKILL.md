---
name: swarma-site
description: >
  Author Russian and English pages in swarma-site and run its Astro build,
  publication, identifier and accessibility checks. Use for Swarma site content,
  locale metadata, book references and publication-check diagnostics, including
  правки страниц сайта Swarma. Use the design-system skill for shared visual
  foundations; this skill supplies the site's content contracts and commands.
---

# Swarma site

Work from the repository root. Read the [README](../../../README.md) and the
relevant page in the [site design contract](../../../docs/design-contract.md)
before authoring. The site describes the platform's design, guarantees and limits;
delivery status stays in the book. Shared visual guidance comes from the
[Swarma Platform Design System](https://github.com/relux-works/swarma-platform-design-system/blob/ae0ba3b3913b44d2f8d476ff24e9965df9277428/SKILL.md).
Its general components do not override the site's ban on status UI or its
publication holds.

## Author a page

- Edit Markdown under [src/content/pages/ru/](../../../src/content/pages/ru/)
  first; add an English counterpart under
  [src/content/pages/en/](../../../src/content/pages/en/) only when translated
  content exists. Each English path requires the matching Russian path.
  `index.md` is the locale home; the file path supplies the slug, and the language
  switch links only existing counterparts. Follow the canonical lowercase
  alphanumeric, slash and hyphen rules in [i18n.mjs](../../../scripts/checks/i18n.mjs).
- Supply exactly `title` and `description` as nonempty trimmed strings, `order`
  as a finite number, and `nav` as a boolean. The
  [page schema](../../../src/lib/page-schema.mjs) is strict: extra frontmatter
  keys fail. Navigation uses `order`; the
  [collection loader](../../../src/content.config.ts) accepts `ru` and `en`.
- Use level-two headings for the section index and level-three headings for
  stable anchors. Cite the printed book catalog with a standalone
  `Источник: глава NN "Title", раздел "Section"` or
  `Source: chapter NN "Title", section "Section"`; separate references with
  `; `. Validate the actual localized chapter titles and sections rather than
  deriving chapter numbers from source filenames. See
  [markdown-conventions.mjs](../../../src/lib/markdown-conventions.mjs) and
  [book-chapters.json](../../../src/data/book-chapters.json).
- Start a limits blockquote with `**Предел.**` or `**Limit.**`.
  Use `[[publications book]]`, `[[publications papers]]` and `[[repos]]` for
  the shipped data-backed entries. Publication authors and chapter titles must
  exist in both languages; missing translations fail without fallback. See
  [content-data.mjs](../../../src/lib/content-data.mjs) and the
  [README content conventions](../../../README.md#content-conventions).
- Repository URLs and the contact address come from
  [site.json](../../../config/site.json) and
  [repos.json](../../../config/repos.json). Do not add unconfigured addresses,
  private identifiers, host paths or availability claims. The
  [identifier rules](../../../scripts/checks/identifier-rules.mjs),
  [names check](../../../scripts/checks/names.mjs) and
  [status-language check](../../../scripts/checks/status-language.mjs) define
  the actual rejection rules; source-looking markers grant no exemption.

## Run through the supervisor

The [runtime contract](../../../README.md#development) requires Node
`>=22.23.4 <23`, npm and Python 3.12; browser checks require real Chromium.
Use the exact versions in [package-lock.json](../../../package-lock.json),
without dependency upgrades. CI installs pinned Playwright Chromium; local
selection is described in [checks.md](references/checks.md).

Start every application, npm, Python or checker command with the outer
[scripts/run.mjs](../../../scripts/run.mjs) supervisor, including installation:

```sh
node scripts/run.mjs npm ci
node scripts/run.mjs npm run dev
node scripts/run.mjs npm run build
node scripts/run.mjs npm run check
```

Stop the foreground preview server after use. Builds write `dist/`; caches and
check evidence live under `.temp/`. The supervisor redacts both output streams
and preserves child exit codes. Supply deny tokens through `IDENT_DENY_TOKENS`
or the untracked local policy file described in the
[README](../../../README.md#content-conventions), never command arguments.
An unreadable or invalid policy fails closed.

For focused checks, browser prerequisites, report paths and control runs, read
[checks.md](references/checks.md). A build alone does not run the complete
publication and accessibility sequence.

## Keep publication holds intact

Follow [UNRESOLVED_QUESTIONS.md](../../../UNRESOLVED_QUESTIONS.md): obtain the
owner's decision before enabling public book diagrams or publishing PDFs; obtain
the legal operator line before adding legal identity text. Book and paper links
also wait for the docs-side release pipeline, as recorded in the
[design contract](../../../docs/design-contract.md#open-items).

`SWARMA_BOOK_FIGURES=1` permits private inspection, not public publication.
Only `three-layers`, `protocol-topology` and `sublayers` are valid figure names;
unknown markers fail even with figures off. Keep pages complete without figures.
See [book-figures.mjs](../../../src/lib/book-figures.mjs) and the
[figure output gate](../../../scripts/checks/figure-publication.mjs).

Do not write a public accessibility statement from automated reports alone.
The unresolved decision requires actual supported operating-system screen-reader
journeys and a monitored feedback channel. The
[design contract's validation matrix](../../../docs/design-contract.md#10-validation-matrix)
also requires visual and manual review before release.
