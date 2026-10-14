# Demo Walkthrough

## 1 Operations signal to work

Open **Operations center**. The dashboard starts with a synthetic urgent case and a day-6 standard case at risk. Click **At risk of deadline** to open the clinical workbench and confirm the cases are sorted only by time remaining.

## 2 Complete First intake

Open **Submit request**. Enter a synthetic member, provider and member ID, select MRI imaging, and leave conservative therapy unchecked. Submit the request: it becomes a pend-desk task. Return, check all documents, and submit a second sample to see it enter clinical review. Set a request to urgent with missing information to see the direct urgent-nurse route.

## 3 Pend desk to clinical queue

Open **Pend desk**, choose PA-24018, and record documentation received. The task leaves the coordinator queue and becomes a complete case in the clinical workbench. Use the demo clock to advance a synthetic pending case through reminder and escalation points.

## 4 Clinician control

Open **Clinical queue** and review PA-24011. Select a clinical denial and try to save: the prototype requires second clinician review for physical therapy. Record that review, then save the decision with a specific rationale. The request history and dashboard change together.

## 5 API onboarding

Open **API onboarding**. Submit the valid sample to create a request, inspect the acknowledgement, send an invalid sample to view the meaningful 422 response, and simulate an outage to activate portal fallback. Recover the connection and query PA-24021.

## 6 Duplicate and reopen controls

Open **Status & audit**. Confirm or reject PA-24031’s probable match. Unmerge PA-24030 to restore it with its original clock. Reopen PA-24015 to start a preserved-history, 72-hour reopening pathway.

## 7 Gated readiness

Open **Safety & readiness**. AI auto-approval is disabled because the G4 evidence is unverified or failed. Run the kill-switch drill to record an operational control, then note that the gate remains blocked. Gold-card status is also shown as a proposal pending its G3 decision.

## 8 Judge-ready walkthrough

Open **Judge mode** and launch the scenarios in order. Each one changes the same synthetic workspace rather than switching to a disconnected mock:

1. Incomplete standard intake routes to the pend desk.
2. Provider attestation preserves the verification obligation.
3. Exact duplicate keeps the original request and merge audit.
4. Probable duplicate awaits a human choice.
5. Urgent incomplete request bypasses the pend hold.
6. Deadline breach opens a required root-cause investigation.
7. Reopen preserves prior history and starts a 72-hour pathway.
8. API outage makes portal fallback visible.
9. Gold-card evidence remains a controlled proposal.
10. AI gate remains blocked without validated G4 evidence.
11. Kill-switch routes synthetic AI traffic to manual handling.
12. Workload stress makes deadline posture explicit.

Use **Reset demo** before a fresh run. All figures and records in this walkthrough are synthetic unless explicitly tagged `[C]`, `[K]`, `[M]`, or `[R]`.
