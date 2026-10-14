# Prototype Architecture

## Design

The application is a static ES-module single-page prototype. It uses no external package or network call so reviewers can run it from a local HTTP server. The Carelon logo is retained as the supplied SVG asset in `assets/logos/carelon-logo.svg`.

## Modules

- `index.html` loads the application shell.
- `styles.css` provides the responsive Carelon-derived design system and component styling.
- `core.mjs` centralises deadline, risk, document-check, duplicate-match, queue-order and metric calculations.
- `script.js` holds the synthetic fixture state, renders the role-oriented workspaces, applies workflow transitions, and persists a safe subset to browser-local storage.
- `tests/core.test.mjs` covers key source-derived rules.
- `scripts/build.mjs` produces a deployable, dependency-free `dist/` artifact.

## State and workflows

All workspaces reference one shared `state` object. A request contains its identifier, service, channel, documents, urgency, deadline, lane, accountable user, audit events and notices. Actions mutate that same request record, then rerender the relevant display. A JSON-safe subset is saved under a namespaced local-storage key after render so a presenter can move among roles without losing the synthetic workflow. Reset demo removes that local state.

```text
Provider intake
  ├─ coverage or network issue → intercept before submission
  ├─ exact duplicate → merge into existing request
  ├─ standard + missing documents → pend desk
  ├─ urgent + missing documents → urgent nurse queue
  └─ complete → deadline-first clinical queue

Clinical review
  ├─ approve → authorisation and notice
  ├─ information gap → pend desk
  └─ deny → documented rationale + high-overturn second-review control
```

## Metrics

`deriveMetrics` is the single metrics engine used on the operations screen. It filters the same synthetic request data by channel and calculates open, pending, clinical, urgent-at-risk, late, completion and channel-share figures. Static case baselines and modelled targets are deliberately presented as separate reference data.

## Boundaries

This is a client-side demonstration. It provides no real identity control, clinical rules engine, electronic health record connection, FHIR/Da Vinci conformance, message delivery, encryption, production audit store or clinical validation dataset. Browser-local demo persistence is intentionally not a production persistence or audit mechanism.
