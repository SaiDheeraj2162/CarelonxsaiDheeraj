# Visual Design System

## Product point of view

The interface is designed as a high-stakes operations product, not a presentation dashboard. A compact purple navigation rail establishes Carelon-derived ownership, while a warm white workspace gives dense operational content room to breathe. Teal carries positive action and completed work; amber flags time pressure; coral is reserved for breaches, safety failures, and blocked paths.

## Tokens and composition

- **Brand anchor:** supplied Carelon logo, used without recoloring; purple `#5009B5` is the primary shell signal.
- **Operational accents:** teal `#00BBBA`, sky `#44B8F3`, lavender `#794CFF`, amber, and coral.
- **Typography:** a system sans stack with high-weight, compact headings and tabular figures. The hierarchy prioritises deadline, queue ownership, and action over decoration.
- **Layout:** 248px persistent rail, responsive card grid, broad hero panels for role framing, and full-height drawers for case detail.
- **Accessibility:** visible focus treatment, semantic controls and labels, text labels in addition to color, responsive reflow, and reduced-motion support.

## Original visual assets

Six bespoke SVG diagrams make the Complete-First story inspectable without borrowed screenshots or generic stock imagery.

| Asset | Meaning in product |
|---|---|
| `assets/images/complete-first-hero.svg` | Provider → checker → coordinator/reviewer operating ecosystem. |
| `assets/images/request-lifecycle.svg` | Complete, incomplete, and urgent request paths. |
| `assets/images/routing-map.svg` | Routing branches for documents, urgency, duplicates, reopen, and integration failure. |
| `assets/images/pend-desk-flow.svg` | Coordinator work that removes completion chasing from nurse queues. |
| `assets/images/api-sequence.svg` | API acknowledgement, status, error, outage, and portal fallback path. |
| `assets/images/ai-gate.svg` | Shadow-model gate, validation, fairness and fail-safe release posture. |

The diagrams use the same visual language as the UI: rounded operational nodes, relationship arrows, disciplined color coding, and direct labels. They are vector-native so they remain sharp at desktop and mobile sizes.

## Meaningful visualizations

- Channel migration bars compare the clearly-labelled source reference trajectory with the synthetic demo mix.
- Deadline lanes expose the time-remaining ordering that controls the clinical queue.
- The route map connects a user click directly to the affected workspace or API fallback state.
- Performance bars distinguish synthetic operating fixtures from `[C]`, `[K]`, `[M]`, and `[R]` source labels.
- The Scenario model uses a slider to recompute a *modelled*, not observed, financial sensitivity.

## Guardrails in the visual language

Danger colors never stand alone: every blocked or failed gate contains a written reason and next action. AI is visibly shadow-only and the G4 column remains blocked absent evidence. Metrics expose their source/formula panel so a polished surface cannot imply invented production results.
