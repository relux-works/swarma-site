# Publication consumer module

This directory is self-contained. It imports only Node built-ins and pinned packages (markdown-it,
gray-matter, playwright, css-tree and postcss); it never imports a site's policy, configuration or content.
It implements the structural scanner approach independently; no design-system implementation was copied.

- `browser.mjs`: openBrowser(root) provides the same pinned/selected real engine and temporary lifetime to
  publication text, contrast, accessibility and geometry consumers. close() removes reader-local scratch.
- `reader.mjs`: readPublication(file) validates UTF-8 without BOM/NUL before returning text. Explicit binary
  image/font signatures return bytes without a text-rendering claim. Invalid text throws publication-decode.
- `renderer.mjs`: publicationReader(root, {assetRoots}) returns asynchronous values(path, text, {excluded})
  and close(). Values contain consumer text, decoded attributes, AX names/descriptions, JSON/CSS literals;
  prose contains browser text/generated text and accessible names. excluded is an array of preorder DOM
  element indices whose text a caller has independently validated. Attributes remain checked. Asset roots
  are caller-supplied paths relative to root. Framework templates retain raw-source checks; compiled
  output receives browser/JSON/CSS checks. Surface preflight extracts Astro/MDX frontmatter through
  gray-matter without evaluating it. Templates are never parsed as uncompiled HTML. Browser requests cannot leave the synthetic local origin.
  SVG files load as standalone image/svg+xml documents; malformed XML fails publication-decode. Chromium's
  Selection API supplies rendered SVG text and line breaks where innerText is unavailable. SVG text,
  titles, descriptions, decoded attributes and accessible names enter the same policy values as inline SVG.
- `css.mjs`: cssValues validates complete syntax through PostCSS, then uses css-tree's grammar and decoded values.
  Incomplete strings/comments fail rather than relying on EOF recovery. decodePercent performs one URL decode.
- `policy.mjs`: readDenyTokens(file, environment) and readDenyTokensSync read an externally supplied ASCII-only policy. Tokens must match
  `[a-z0-9][a-z0-9._-]{2,}` in full after ASCII whitespace trimming; any invalid entry rejects with a fixed code.
  CI requires the explicit environment list and never reads local fallback. redactor(tokens)
