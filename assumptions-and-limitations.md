# Assumptions and Limitations

## Product assumptions

- The request-level records, API payloads, notices, integration outcomes, model outputs and evaluation data are synthetic demonstration fixtures.
- Carelon brand colors are derived from the supplied logo (`#00BBBA`, `#44B8F3`, `#5009B5`, and `#794CFF`) because no formal brand system was supplied.
- The prototype uses service-specific document *type* checklists. It does not claim to interpret clinical content or meet the solution’s production checker recall thresholds.
- Coordinator staffing, gold-card example values, and shadow-mode values are visibly labelled as planning, recommendation, or synthetic fixture values where appropriate.

## Intentional limitations

- The local API panel is a mock contract, not a deployed FHIR or Da Vinci interface. It has no partner credentials, formal authorization model, encryption, availability measurement or conformance testing.
- The demo clock models workflow transitions in memory. It does not establish actual urgent volumes, 72-hour performance, capacity, regulatory compliance or measured turnaround.
- Any clinical decision in the prototype is fictional and must not be used for care, coverage or reimbursement.
- The AI gate intentionally remains blocked. A passing illustrative fixture cannot substitute for blinded clinical validation, subgroup analysis, sample size, calibrated production performance or governance approval.
- Metrics shown from the source report remain facts, calculations or modelled planning figures as labelled. No synthetic result is presented as an insurer’s real operating result.

## Non-negotiable safety constraints preserved

- AI never denies or exposes a likely-deny recommendation.
- Urgent requests bypass the completeness hold.
- Potential denials remain clinician controlled.
- Imaging, PT and equipment denials require a second-clinician control in the demonstration.
- Exact duplicates are not denied and every merge can be reversed.
