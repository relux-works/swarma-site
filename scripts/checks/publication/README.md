# Publication consumer module

This directory is self-contained. It imports only Node built-ins and pinned packages (markdown-it,
gray-matter, playwright, css-tree and postcss); it never imports a site's policy, configuration or content.
It implements the structural scanner approach independently; no design-system implementation was copied.

- `reader.mjs`: readPublication(file) validates UTF-8 without BOM/NUL before returning text. Explicit binary
  image/font signatures return bytes without a text-rendering claim. Invalid text throws publication-decode.
- `renderer.mjs`: publicationReader(root, {assetRoots}) returns asynchronous values(path, text, {excluded})
  and close(). Values contain consumer text, decoded attributes, AX names/descriptions, JSON/CSS literals;
  prose contains browser text/generated text and accessible names. excluded is an array of preorder DOM
  element indices whose text a caller has independently validated. Attributes remain checked. Asset roots
  are caller-supplied paths relative to root. Browser requests cannot leave the synthetic local origin.
  SVG files load as standalone image/svg+xml documents; malformed XML fails publication-decode. Chromium's
  Selection API supplies rendered SVG text and line breaks where innerText is unavailable. SVG text,
  titles, descriptions, decoded attributes and accessible names enter the same policy values as inline SVG.
- `css.mjs`: cssValues validates complete syntax through PostCSS, then uses css-tree's grammar and decoded values.
  Incomplete strings/comments fail rather than relying on EOF recovery. decodePercent performs one URL decode.
- `policy.mjs`: readDenyTokens(file, environment) reads an externally supplied policy. redactor(tokens)
  sanitizes all diagnostics; failure(code) and safeError(error, fallback) carry fixed rule codes.
- `normalization.mjs`: normalizeText collapses Unicode whitespace/separators and removes soft hyphens,
  U+180E, U+200B–U+200D, U+2060 and U+FEFF. Generic rules use this spaced form. includesToken also compares
  literals without separators; tokenRanges maps overlapping matches back to original text for redaction.
  Browser line breaks, including br and block elements, are whitespace in the comparison. Syntax in code
  examples is never recursively decoded by normalization.

The caller retains raw-source policy checks, applies rules to returned values, redacts every output path,
and always closes the reader in finally. Downloads and traces stay under root/.temp/. Playwright manages
and removes browser profiles in the caller's OS temporary directory (TMPDIR when supplied). Keep that
directory short for Chromium's Unix socket limit; it must not depend on publication/fixture nesting.
Browser XDG cache/config/data directories live in the reader scratch and are removed with it.
No source text, rendered values or external policy is persisted by this module. Missing browser/read/parse
failures must reject rather than count as a clean scan. Script execution and external resources are disabled.
The renderer samples 390px/1440px, light/dark, increased contrast and forced colors when styles are present;
it does not claim exhaustive media-query behavior, arbitrary script transformations or numeric contrast.
