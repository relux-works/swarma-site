# Site check selection and evidence

Run these commands from the repository root after the supervised lockfile install.
The command names and full ordering come from
[package.json](../../../../package.json); the
[README tools table](../../../../README.md#tools-and-checks) describes their limits.

| Need | Supervised command | Evidence / boundary |
| --- | --- | --- |
| Complete validation | `node scripts/run.mjs npm run check` | Browser readiness, tests, build, then publication, identifiers, status language, names, i18n, fonts, contrast, a11y, header and deployment; stops at a failed stage |
| Locale paths and metadata | `node scripts/run.mjs npm run check:i18n` | Console; strict metadata and English-to-Russian counterparts |
| Published file types and browser consumers | `node scripts/run.mjs npm run check:publication-surface` | Console; decoded source/output surfaces, not a raw-text-only search |
| Identifiers and configured links | `node scripts/run.mjs npm run check:identifiers` | Console; configured exact values and external deny policy |
| Status and naming policy | `node scripts/run.mjs npm run check:no-status`, `node scripts/run.mjs npm run check:status-language`, `node scripts/run.mjs npm run check:names` | Separate console gates; status markup, availability language and unapproved names |
| Figure leakage | `node scripts/run.mjs npm run check:figures` | Console; public output must contain no book-figure representation with figures off |
| Asset integrity | `node scripts/run.mjs npm run check:brand`, `node scripts/run.mjs npm run check:fonts` | Separate SHA-256 manifest gates; do not regenerate manifests to bless changed artwork or fonts |
| Contrast | `node scripts/run.mjs npm run check:contrast` | `.temp/contrast/report.json`; built documents in Chromium across 16 appearances |
| Accessibility and geometry | `node scripts/run.mjs npm run check:a11y`, `node scripts/run.mjs npm run check:header` | `.temp/a11y/report.json`, screenshots and `.temp/a11y/geometry.json`; header widths 320–1920 at 16px/32px root text |
| Shipped headers and 404 | `node scripts/run.mjs npm run check:deployment` | Console; temporary local server and browser close before exit; does not validate account, DNS or edge configuration |

`npm run build` runs `prebuild` (publication surface, no-status, i18n, brand)
and `postbuild` (figures, no-status) around Astro. It is not equivalent to `check`.

## Real browser and diagnostics

[browser.mjs](../../../../scripts/checks/publication/browser.mjs) launches
Playwright Chromium, optionally selected by
`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`. The README's local prerequisite is an
installed Google Chrome; CI instead installs the lockfile's Playwright Chromium.
Keep the OS temporary path short enough for Chromium's Unix socket. Reader
scratch lives in `.temp/publication-browser/run-*` and is removed when closed.
Use `node scripts/run.mjs npm run check:browser` to verify rendered readiness.
An unavailable browser is a failed prerequisite, not evidence of passing checks.

Leaf scripts forward options as an argument array. For example:

```sh
node scripts/run.mjs npm run check:contrast -- --control
node scripts/run.mjs node scripts/checks/a11y.mjs --control
node scripts/run.mjs node scripts/checks/a11y.mjs --matrix
```

The contrast control must exit 1; the a11y control must reject the missing-alt
witness with `image-alt` and writes `.temp/a11y/control.json`. The extended matrix
writes `.temp/a11y/matrix.json`. Compound scripts (`check`, `test`, `prebuild`,
`postbuild`) accept no extra options; choose a leaf checker instead. Do not put
forwarded values into the supervisor's internal fixed `--shell` command string.
See [run.mjs](../../../../scripts/run.mjs) and the
[README command contract](../../../../README.md#content-conventions).

For private figure inspection, the existing command is
`SWARMA_BOOK_FIGURES=1 node scripts/run.mjs npm run check`. Afterwards rerun with
the variable unset for public output. This switch grants no publication decision.

## Reports are bounded evidence

[ci-evidence.mjs](../../../../scripts/checks/ci-evidence.mjs) lists all ten required
nonempty JSON reports. Run
`node scripts/run.mjs node scripts/checks/ci-evidence.mjs` to check their presence;
it does not inspect their verdicts. Read the reports and retain actual failing
stages, exits and missing prerequisites when reporting results.

The [CI workflow](../../../../.github/workflows/ci.yml) runs both figure modes.
Fork PRs skip its secret-dependent job and remain untested at merge review.
Selected reports/screenshots are offered as `accessibility-figures-0` and
`accessibility-figures-1` archives with three-day retention; upload failures are
nonblocking, so a green job does not establish that an archive exists.

Automation does not complete the
[manual release matrix](../../../../docs/design-contract.md#10-validation-matrix)
or the [open publication decisions](../../../../UNRESOLVED_QUESTIONS.md).
