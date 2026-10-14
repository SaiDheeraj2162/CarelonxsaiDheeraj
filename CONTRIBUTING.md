# Contributing

Thanks for improving the Complete-First prototype. This repository is a static product demonstration, so changes should keep the demo inspectable, deterministic, and explicit about its synthetic-data boundary.

## Before you start

1. Open an issue for a material feature, workflow change, safety concern, or visual defect before investing in a large pull request.
2. Do not add real member, provider, clinical, credential, or integration data. Fixtures must remain synthetic.
3. Keep clinical, coverage, and automation claims within the limitations described in [docs/assumptions-and-limitations.md](docs/assumptions-and-limitations.md).

## Local workflow

```sh
npm ci
npm run verify
```

`npm run verify` runs JavaScript syntax checks, tests, and the static production build. Run the built output with any local static server before opening a visual change pull request.

## Change expectations

- Add or adjust tests when changing a workflow rule in `core.mjs` or a shared product behavior in `script.js`.
- Preserve the source-label convention: `[C]` case fact, `[K]` calculated figure, `[M]` planning-model output, and `[R]` recommendation.
- Never present a synthetic fixture as a production measure, actual clinical conclusion, or live partner integration.
- Preserve the AI safeguards: no AI denial, no likely-deny recommendation, and G4 stays blocked until validated evidence exists.
- Use the supplied Carelon logo as provided; do not replace it with third-party brand assets.
- Keep the app dependency-free unless a new dependency has a clearly documented product and maintenance reason.

## Pull requests

Use the pull request template, describe the user-visible change, and state how you tested it. Include screenshots for visual changes when your environment permits them. Do not commit the generated `dist/` directory.

## Reporting problems

Use the issue forms for non-sensitive defects and proposals. Follow [SECURITY.md](SECURITY.md) for a security concern; do not disclose a suspected vulnerability in a public issue.
