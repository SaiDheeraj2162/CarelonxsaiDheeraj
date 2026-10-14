import {
  SERVICE_REQUIREMENTS,
  deadlineOrder,
  deriveMetrics,
  duplicateMatch,
  formatRemaining,
  missingDocuments,
  probableDuplicateMatch,
  riskFor,
  timeRemainingHours,
} from "./core.mjs";

const iconPaths = {
  dashboard: '<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  inbox: '<path d="M4 5h16v14H4zM4 12h4l2 3h4l2-3h4"/>',
  clipboard: '<rect x="6" y="5" width="12" height="15" rx="2"/><path d="M9 5V3h6v2M9 10h6M9 14h6"/>',
  plug: '<path d="M12 3v7M8 6v4M16 6v4M7 10h10v2a5 5 0 0 1-10 0zM12 17v4"/>',
  shield: '<path d="M12 3 19 6v5c0 4.3-2.8 7.5-7 10-4.2-2.5-7-5.7-7-10V6z"/><path d="m9 12 2 2 4-4"/>',
  activity: '<path d="M3 12h4l2-6 4 12 2-6h6"/>',
  clock: '<circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/>',
  chevron: '<path d="m9 18 6-6-6-6"/>',
  alert: '<path d="m12 3 9 16H3z"/><path d="M12 9v4M12 17h.01"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  search: '<circle cx="11" cy="11" r="6"/><path d="m16 16 4 4"/>',
  file: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
  users: '<path d="M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM17 10a3 3 0 0 0 0-6M21 19v-1a4 4 0 0 0-3-3.87"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  refresh: '<path d="M20 11a8 8 0 0 0-14.5-4.6L4 8M4 4v4h4M4 13a8 8 0 0 0 14.5 4.6L20 16M20 20v-4h-4"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  merge: '<path d="M7 4v6a2 2 0 0 0 2 2h8M17 20v-6a2 2 0 0 0-2-2H7M14 17l3 3 3-3M10 7 7 4 4 7"/>',
  external: '<path d="M14 4h6v6M20 4l-9 9M17 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h5"/>',
};

function icon(name, className = "") {
  return `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconPaths[name] || iconPaths.file}</svg>`;
}

const navItems = [
  ["dashboard", "Operations center", "dashboard"],
  ["submit", "Submit request", "plus"],
  ["pend", "Pend desk", "inbox"],
  ["queue", "Clinical queue", "clipboard"],
  ["integrations", "API onboarding", "plug"],
  ["insights", "Performance & quality", "activity"],
  ["governance", "Safety & readiness", "shield"],
  ["audit", "Status & audit", "activity"],
  ["financial", "Scenario model", "dashboard"],
  ["judge", "Judge mode", "arrow"],
];

const initialNow = "2026-12-18T14:00:00.000Z";
const initialRequests = [
  {
    id: "PA-24018", member: "Avery Martin", memberId: "M-200417", provider: "Evergreen Orthopedics", group: "Evergreen", service: "Lumbar MRI", serviceCode: "72148", serviceFamily: "imaging", channel: "portal", urgency: "standard", status: "pending-information", lane: "pend desk", completeness: "incomplete", missing: ["6 weeks conservative therapy"], submittedAt: "2026-12-13T10:00:00.000Z", deadline: "2026-12-20T10:00:00.000Z", open: true, assignedTo: "Coordinator Maya", escalation: "day-4", notices: ["Itemised information request sent", "24-hour reminder sent", "48-hour reminder sent"], documents: ["Clinical note", "Imaging order"], events: ["Document checker flagged missing conservative-therapy history.", "Coordinator call due today."], evidence: "Clinical note attached. Conservative-treatment history is not stated.", lineOfBusiness: "Employer",
  },
  {
    id: "PA-24021", member: "Leo Thompson", memberId: "M-200981", provider: "Riverbend Rehab", group: "Riverbend", service: "Physical therapy", serviceCode: "97110", serviceFamily: "physicalTherapy", channel: "api", urgency: "standard", status: "clinical-review", lane: "nurse queue", completeness: "complete", missing: [], submittedAt: "2026-12-17T10:00:00.000Z", deadline: "2026-12-24T10:00:00.000Z", open: true, assignedTo: "Nurse R. Khan", notices: ["Acknowledgement delivered"], documents: ["Evaluation", "Treatment plan", "Functional limitation"], events: ["API document checker passed.", "Deadline-first nurse assignment made."], evidence: "Evaluation documents functional limitation and proposed plan of care.", lineOfBusiness: "Medicare",
  },
  {
    id: "PA-24023", member: "Jamal Brown", memberId: "M-200732", provider: "Northstar DME", group: "Northstar", service: "Mobility equipment", serviceCode: "E0973", serviceFamily: "equipment", channel: "fax", urgency: "urgent", status: "clinical-review", lane: "urgent nurse queue", completeness: "incomplete", missing: ["Face-to-face note"], submittedAt: "2026-12-16T01:00:00.000Z", deadline: "2026-12-19T01:00:00.000Z", open: true, assignedTo: "Nurse S. Patel", notices: ["Urgent acknowledgement logged", "Same-hour phone outreach logged"], documents: ["Prescription", "Functional need"], events: ["Urgent request bypassed completeness hold.", "48-hour escalation issued to team lead."], evidence: "Fax image includes prescription and functional-need statement. Face-to-face note is not readable.", lineOfBusiness: "Medicaid",
  },
  {
    id: "PA-24029", member: "Nora Singh", memberId: "M-200284", provider: "Evergreen Orthopedics", group: "Evergreen", service: "Knee MRI", serviceCode: "73721", serviceFamily: "imaging", channel: "portal", urgency: "standard", status: "clinical-review", lane: "nurse queue", completeness: "complete", missing: [], submittedAt: "2026-12-17T08:00:00.000Z", deadline: "2026-12-24T08:00:00.000Z", open: true, assignedTo: "Unassigned", notices: ["Acknowledgement delivered"], documents: ["Clinical note", "6 weeks conservative therapy", "Imaging order"], events: ["Submitted through portal.", "No exact duplicate at first submission."], evidence: "Provider note documents 8 weeks of directed conservative treatment and persistent symptoms.", lineOfBusiness: "Employer",
  },
  {
    id: "PA-24030", member: "Nora Singh", memberId: "M-200284", provider: "Evergreen Orthopedics", group: "Evergreen", service: "Knee MRI", serviceCode: "73721", serviceFamily: "imaging", channel: "portal", urgency: "standard", status: "merged", lane: "duplicate control", completeness: "complete", missing: [], submittedAt: "2026-12-17T09:00:00.000Z", deadline: "2026-12-24T09:00:00.000Z", originalDeadline: "2026-12-24T09:00:00.000Z", open: false, duplicateOf: "PA-24029", notices: ["Merged into PA-24029; original clock retained"], documents: ["Clinical note"], events: ["Exact duplicate merged automatically under rule D-1."], evidence: "Merged documents are attached to PA-24029.", lineOfBusiness: "Employer",
  },
  {
    id: "PA-24031", member: "Avery Martin", memberId: "M-200417", provider: "Lakeview Imaging", group: "Lakeview", service: "Cervical MRI", serviceCode: "72141", serviceFamily: "imaging", channel: "fax", urgency: "standard", status: "probable-duplicate", lane: "coordinator confirmation", completeness: "complete", missing: [], submittedAt: "2026-12-18T09:00:00.000Z", deadline: "2026-12-25T09:00:00.000Z", open: true, probableOf: "PA-24018", assignedTo: "Intake coordinator", notices: ["Confirmation task created; both clocks continue"], documents: ["Clinical note", "6 weeks conservative therapy", "Imaging order"], events: ["Probable duplicate: same member and imaging family within 30 days."], evidence: "Different site and service code; human confirmation required.", lineOfBusiness: "Employer",
  },
  {
    id: "PA-24011", member: "Mia Chen", memberId: "M-200908", provider: "Eastfield Rehab", group: "Eastfield", service: "Physical therapy", serviceCode: "97110", serviceFamily: "physicalTherapy", channel: "api", urgency: "standard", status: "clinical-review", lane: "nurse queue", completeness: "complete", missing: [], submittedAt: "2026-12-12T23:00:00.000Z", deadline: "2026-12-19T23:00:00.000Z", open: true, assignedTo: "Unassigned", notices: ["Day-6 at-risk notice created"], documents: ["Evaluation", "Treatment plan", "Functional limitation"], events: ["Complete request held in deadline-first queue."], evidence: "Therapy evaluation documents current functional limitation and treatment goals.", lineOfBusiness: "Medicare",
  },
  {
    id: "PA-24015", member: "Oscar Reed", memberId: "M-200511", provider: "Northstar DME", group: "Northstar", service: "Mobility equipment", serviceCode: "E0973", serviceFamily: "equipment", channel: "fax", urgency: "standard", status: "denied", lane: "decision complete", completeness: "incomplete", missing: ["Face-to-face note"], submittedAt: "2026-12-10T10:00:00.000Z", deadline: "2026-12-17T10:00:00.000Z", open: false, deniedAt: "2026-12-16T16:00:00.000Z", denialReason: "Missing face-to-face note", denialCriterion: "Documentation for durable medical equipment must include a qualifying face-to-face encounter.", reopenEligible: true, notices: ["Denial notice with 14-day reopening option created"], documents: ["Prescription", "Functional need"], events: ["Decision on available record after documented outreach."], evidence: "Required face-to-face encounter note was absent.", lineOfBusiness: "Medicaid",
  },
  {
    id: "PA-24009", member: "Carla Reyes", memberId: "M-200330", provider: "Riverbend Rehab", group: "Riverbend", service: "Physical therapy", serviceCode: "97110", serviceFamily: "physicalTherapy", channel: "api", urgency: "standard", status: "approved", lane: "decision complete", completeness: "complete", missing: [], submittedAt: "2026-12-12T09:00:00.000Z", deadline: "2026-12-19T09:00:00.000Z", open: false, decisionAt: "2026-12-14T15:00:00.000Z", decisionType: "nurse approval", authorization: "AUTH-992114", notices: ["Approval notice created"], documents: ["Evaluation", "Treatment plan", "Functional limitation"], events: ["Nurse reviewer approved against documented criteria."], evidence: "Approved in sample fixture.", lineOfBusiness: "Employer",
  },
];

const initialState = {
  page: "dashboard",
  now: initialNow,
  requests: structuredClone(initialRequests),
  selectedRequest: null,
  metricChannel: "all",
  selectedIntegration: "Evergreen Health System",
  apiResponse: null,
  integrationState: { "Evergreen Health System": "connected", "St. Anne's Medical Group": "testing" },
  activities: [
    { time: "08:42", title: "48-hour urgent escalation recorded", copy: "PA-24023 alerted the team lead; it remains in the urgent nurse queue.", kind: "alert" },
    { time: "08:18", title: "API acknowledgement returned", copy: "Riverbend Rehab received PA-24021 and its decision deadline.", kind: "info" },
    { time: "Yesterday", title: "Exact duplicate merged", copy: "PA-24030 attached to PA-24029. Original clock remains unchanged.", kind: "info" },
    { time: "Yesterday", title: "Day-4 coordinator escalation", copy: "PA-24018 has an unanswered document request and a scheduled call.", kind: "alert" },
  ],
  form: { member: "", memberId: "", provider: "", service: "imaging", channel: "portal", urgency: "standard", coverage: "covered", network: "in-network", documents: [], attest: false },
  toasts: [],
  aiKillSwitchTested: false,
  aiManualRouting: false,
  secondReview: {},
  metricFocus: "open",
  routeFocus: "complete",
  scenarioSelected: "incomplete",
  financialAppealRate: 20,
  apiPending: false,
  refresh: 0,
};

const STORAGE_KEY = "carelon-complete-first-judge-demo-v1";

function hydrateState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved || !Array.isArray(saved.requests)) return structuredClone(initialState);
    return { ...structuredClone(initialState), ...saved, toasts: [], selectedRequest: null, clockOpen: false, apiPending: false };
  } catch {
    return structuredClone(initialState);
  }
}

let state = hydrateState();

function persistState() {
  try {
    const { toasts, selectedRequest, clockOpen, apiPending, ...persistable } = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persistable));
  } catch { /* Browser storage is optional in this local demonstration. */ }
}

function resetState() {
  state = structuredClone(initialState);
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* no-op */ }
  render();
  toast("Demo reset to its initial synthetic scenario.", "good");
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;" }[character]));
}

function titleCase(value) { return value.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function requestById(id) { return state.requests.find((request) => request.id === id); }
function nextRequestId() { return `PA-${24032 + state.requests.filter((request) => request.id.startsWith("PA-24")).length}`; }
function toLocalTime(iso) { return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true, timeZone: "America/Chicago" }).format(new Date(iso)); }
function nowLabel() { return `${toLocalTime(state.now)} CT`; }
function serviceLabel(key) { return ({ imaging: "MRI imaging", physicalTherapy: "Physical therapy", equipment: "Mobility equipment", homeHealth: "Home health" })[key] || key; }
function dataTag(type, text) { return `<span class="pill ${type}">${text}</span>`; }

function riskTag(request) {
  const risk = riskFor(request, state.now);
  const className = risk.level === "critical" || risk.level === "late" ? "risk" : risk.level === "watch" ? "warn" : risk.level === "resolved" ? "ok" : "info";
  return `<span class="tag ${className}">${risk.label}</span>`;
}

function statusTag(status) {
  const mapping = {
    "pending-information": ["warn", "Needs information"], "clinical-review": ["info", "Clinical review"], "probable-duplicate": ["pending", "Confirm match"], merged: ["pending", "Merged"], denied: ["risk", "Denied"], approved: ["ok", "Approved"], reopened: ["info", "Reopened"],
  };
  const [className, label] = mapping[status] || ["info", titleCase(status)];
  return `<span class="tag ${className}">${label}</span>`;
}

function toast(message, kind = "") {
  const id = Date.now() + Math.random();
  state.toasts.push({ id, message, kind });
  renderToasts();
  window.setTimeout(() => {
    state.toasts = state.toasts.filter((item) => item.id !== id);
    renderToasts();
  }, 3700);
}

function renderToasts() {
  let region = document.querySelector(".toast-region");
  if (!region) {
    region = document.createElement("div");
    region.className = "toast-region";
    document.body.appendChild(region);
  }
  region.innerHTML = state.toasts.map((item) => `<div class="toast ${item.kind}">${escapeHtml(item.message)}</div>`).join("");
}

function renderShell(content) {
  return `<div class="app-shell">
    <aside class="sidebar">
      <div class="brand-lockup"><img src="assets/logos/carelon-logo.svg" alt="Carelon" /><p class="prototype-label">Complete-First prototype</p></div>
      <nav class="nav-group" aria-label="Primary navigation">
        ${navItems.map(([key, label, iconName]) => `<button class="nav-item ${state.page === key ? "active" : ""}" data-action="navigate" data-page="${key}">${icon(iconName)}<span>${label}</span></button>`).join("")}
      </nav>
      <div class="side-note"><strong>Simulation environment</strong>All request records, API payloads, metrics and AI evidence in this prototype are synthetic. Case baselines are labelled separately.</div>
    </aside>
    <section class="main">
      <header class="topbar">
        <div class="topbar-left"><span class="crumb">Prior authorization</span>${icon("chevron")}<span class="topbar-title">Complete-First operating model</span></div>
        <div class="topbar-right"><span class="clock">${icon("clock")}Demo time · ${nowLabel()}</span><span class="tag tag-dot ok">Simulation live</span><span class="avatar" title="Demo user">AR</span></div>
      </header>
      <main class="content">${content}</main>
    </section>
  </div>`;
}

function pageHeader(eyebrow, title, lede, actions = "") {
  return `<div class="page-heading"><div><div class="eyebrow">${eyebrow}</div><h1>${title}</h1><p class="lede">${lede}</p></div><div class="page-actions">${actions}</div></div>`;
}

function dashboard() {
  const metrics = deriveMetrics(state.requests, state.now, state.metricChannel);
  const atRisk = state.requests.filter((request) => request.open && ["critical", "late"].includes(riskFor(request, state.now).level));
  const clinicalAtRisk = state.requests.filter((request) => request.open && request.urgency === "standard" && riskFor(request, state.now).level === "critical").length;
  return `
    <section class="product-hero" aria-label="Complete First operating model overview">
      <div class="hero-copy"><div class="hero-kicker">Carelon · simulated operations</div><h2>Complete at the front door.<br />Clear cases move faster.</h2><p>One connected operating model keeps incomplete work with the pend desk, exposes every deadline, and preserves clinical accountability for every possible denial.</p><div class="hero-actions"><button class="button aqua" data-action="navigate" data-page="judge">${icon("arrow")}Start judge walkthrough</button><button class="button secondary" data-action="open-clock">${icon("clock")}Run the clock</button></div><div class="hero-stat-row"><div class="hero-stat"><strong>${metrics.completeRate}%</strong><span>complete in demo</span></div><div class="hero-stat"><strong>${metrics.atRisk}</strong><span>deadline risks</span></div><div class="hero-stat"><strong>${metrics.apiRate}%</strong><span>API share in demo</span></div></div></div>
      <figure class="hero-illustration"><img src="assets/images/complete-first-hero.svg" alt="Provider, intake checker, coordinator and reviewer connected by a controlled request path" /></figure>
    </section>
    ${pageHeader("Operational control", "Operations command center", "A live, synthetic operating view. Select a metric to inspect its definition and move to the relevant work.", `<select class="filter-select" data-input="metric-channel" aria-label="Filter dashboard by channel"><option value="all">All channels</option><option value="api" ${state.metricChannel === "api" ? "selected" : ""}>API</option><option value="portal" ${state.metricChannel === "portal" ? "selected" : ""}>Portal</option><option value="fax" ${state.metricChannel === "fax" ? "selected" : ""}>Fax</option></select><button class="button secondary" data-action="open-clock">${icon("clock")}Demo clock</button>`)}
    ${metrics.atRisk ? `<div class="alert-strip">${icon("alert")}<div><strong>${metrics.atRisk} deadline-risk ${metrics.atRisk === 1 ? "case" : "cases"} in the demo queue.</strong> ${metrics.urgentAtRisk ? "An urgent request is within 12 hours of its 72-hour deadline." : "Review the day-6 standard request before it breaches."}</div><button class="text-button" data-action="navigate" data-page="queue">Open queue</button></div>` : ""}
    <section class="metric-grid" aria-label="Operational metrics">
      ${metricCard("Open requests", metrics.open, "Synthetic records in the current simulation", "open", "queue", "clipboard")}
      ${metricCard("Needs coordinator action", metrics.pending, "Incomplete requests routed away from nurses", "pend", "pend", "inbox")}
      ${metricCard("At risk of deadline", metrics.atRisk, `${metrics.urgentAtRisk} urgent • ${metrics.late} breached`, "risk", "queue", "alert", metrics.atRisk > 0)}
      ${metricCard("Complete on arrival", `${metrics.completeRate}%`, "Case baseline: 72% complete [K]", "complete", "submit", "check")}
    </section>
    ${metricDetail(metrics)}
    <section class="analysis-grid">
      <div class="stack">
        <article class="panel"><header class="panel-header"><div><h2>Deadline posture</h2><p>Derived from synthetic requests and the accelerated demo clock.</p></div>${dataTag("synthetic", "Simulation")}</header><div class="panel-body"><div class="chart">
          ${barRow("Urgent &lt;12 hours", metrics.urgentAtRisk, 3, "red")}
          ${barRow("Standard day 6", clinicalAtRisk, 4, "amber")}
          ${barRow("Clinical review", metrics.clinical, 6, "purple")}
          ${barRow("Pending information", metrics.pending, 6, "")}
        </div><div class="legend"><span><i class="amber"></i>Action window</span><span><i class="purple"></i>Clinician-owned</span><span><i class="aqua"></i>Coordinator-owned</span></div></div></article>
        <article class="panel"><header class="panel-header"><div><h2>Request lifecycle</h2><p>Automation helps front-door routing. A clinician retains accountability for decisions.</p></div><span class="pill case">Source workflow</span></header><div class="visual-frame"><img src="assets/images/request-lifecycle.svg" alt="End-to-end request lifecycle from submission to accountable decision" /></div></article>
        <article class="panel"><header class="panel-header"><div><h2>Deadline-first lanes</h2><p>Priority is driven only by time remaining; provider size and predicted outcome are excluded.</p></div><button class="text-button" data-action="navigate" data-page="queue">Open workbench</button></header><div class="panel-body"><div class="lane-list">
          ${lane("Urgent nurse queue", metrics.urgent, "Urgent requests bypass the completeness hold.", "alert")}
          ${lane("Clinical review", metrics.clinical, "Complete requests ordered by regulatory deadline.", "clipboard")}
          ${lane("Pend desk", metrics.pending, "Itemised outreach and reminders; no clinical denial.", "inbox")}
          ${lane("Duplicate control", state.requests.filter((request) => request.status === "probable-duplicate").length, "Human confirmation with both clocks running.", "merge")}
        </div></div></article>
      </div>
      <div class="stack">
        <article class="panel"><header class="panel-header"><div><h2>Channel migration</h2><p>Case baseline versus target; the demo’s current records drive the bold values.</p></div>${dataTag("model", "[C] [M]")}</header><div class="panel-body"><div class="channel-bars">${channelRow("API", metrics.apiRate, 8.2, 25, "api")}${channelRow("Portal", Math.round(state.requests.filter((item) => item.channel === "portal").length / Math.max(state.requests.length, 1) * 100), 0, 0, "portal")}${channelRow("Fax", metrics.faxRate, 45, 32, "fax")}${channelRow("Phone", 0, 0, 0, "phone")}</div><div class="notice" style="margin-top:15px">API target ≥25% by March is a planning target from the supplied solution; two hospital groups are simulated here.</div></div></article>
        <article class="panel"><header class="panel-header"><div><h2>Active alerts</h2><p>Generated from the current state, not a static alert list.</p></div></header><div class="panel-body">${alertTimeline(atRisk)}</div></article>
        <article class="panel"><header class="panel-header"><div><h2>Reference trajectory</h2><p>Case baseline and planning model, not measured demo performance.</p></div>${dataTag("model", "[C] [M]")}</header><div class="panel-body"><div class="chart">
          ${barRow("Sep 2026 baseline", 80, 100, "amber", "80.0% [C]")}
          ${barRow("Jan commitment", 90, 100, "purple", "≥90% [M]")}
          ${barRow("Mar reference", 91.5, 100, "", "91.5% [M]")}
        </div><div class="notice">Interim milestones are not regulatory compliance. The underlying case requires every request to be on time.</div></div></article>
      </div>
    </section>
    <section class="visual-grid"><article class="panel"><header class="panel-header"><div><h2>Interactive routing map</h2><p>Choose a route to open the relevant shared workspace. Each branch is grounded in the source-defined handling rules.</p></div></header><div class="visual-frame"><img src="assets/images/routing-map.svg" alt="Routing diagram for complete, incomplete, urgent, duplicate, reopening and integration-failure requests" /><div class="route-choices"><button class="route-choice" data-action="route-focus" data-route="complete">Complete standard → nurse queue</button><button class="route-choice" data-action="route-focus" data-route="incomplete">Incomplete → pend desk</button><button class="route-choice" data-action="route-focus" data-route="urgent">Urgent → urgent lane</button><button class="route-choice" data-action="route-focus" data-route="duplicate">Duplicate controls</button><button class="route-choice" data-action="route-focus" data-route="failure">Integration fallback</button></div></div></article>
    <article class="panel"><header class="panel-header"><div><h2>Denial-quality bridge</h2><p>Planning model identifies how the source expects the rate to change. It does not change clinical criteria.</p></div>${dataTag("model", "[M]")}</header><div class="panel-body"><div class="bridge"><div class="bridge-step"><span class="bridge-value">17.0%</span><div class="bridge-block" style="height:124px"></div><span class="bridge-caption">Sep case baseline</span></div><div class="bridge-step"><span class="bridge-value">−4.15</span><div class="bridge-block negative" style="height:82px"></div><span class="bridge-caption">Complete submissions</span></div><div class="bridge-step"><span class="bridge-value">−0.79</span><div class="bridge-block negative" style="height:47px"></div><span class="bridge-caption">Duplicates merged</span></div><div class="bridge-step"><span class="bridge-value">−0.86</span><div class="bridge-block warning" style="height:52px"></div><span class="bridge-caption">Coverage / network interception</span></div><div class="bridge-step"><span class="bridge-value">11.2%</span><div class="bridge-block" style="height:68px"></div><span class="bridge-caption">Published rate Mar [M]</span></div></div><div class="notice" style="margin-top:14px">Clinical-guideline denials are held flat in the model. Prevention, merging and interception must not be misrepresented as improved clinical decisions.</div></div></article></section>
    <section class="panel section-spacer"><header class="panel-header"><div><h2>Release path and gates</h2><p>G1–G5 follows the proposed timing and evidence-gated operating plan.</p></div><button class="text-button" data-action="navigate" data-page="governance">Open readiness</button></header><div class="panel-body"><div class="roadmap"><div class="gate"><strong>G1 · Nov 27</strong>Capacity and pend-desk evidence</div><div class="gate"><strong>G2 · Dec 22</strong>MVP exit criteria</div><div class="gate"><strong>G3 · Jan 4</strong>Gold-card decision</div><div class="gate"><strong>G4 · Mar 1</strong>AI safety release gate</div><div class="gate"><strong>G5 · Apr</strong>Funding and scale decision</div></div></div></section>`;
}

function metricCard(label, value, sub, metric, targetPage, iconName, risk = false) { return `<article class="metric-card ${risk ? "risk-card" : ""}" data-action="metric-detail" data-metric="${metric}" data-page="${targetPage}" role="button" tabindex="0"><div class="label">${icon(iconName)}${label}</div><div class="metric">${value}</div><div class="sub">${sub}</div></article>`; }
function metricDetail(metrics) {
  const details = {
    open: { title: "Open requests", definition: "Requests still active in the synthetic demonstration dataset.", formula: `${metrics.open} open ÷ ${metrics.total} records in selected channel`, source: "Synthetic request state", target: "Inspect by deadline-first queue" },
    pend: { title: "Coordinator action", definition: "Open standard requests awaiting missing information or confirmation; coordinator work is separate from nurse review.", formula: `${metrics.pending} pending-information records`, source: "Synthetic request state", target: "Open pend desk" },
    risk: { title: "Deadline risk", definition: "Open request with urgent ≤12 hours remaining, or standard ≤24 hours remaining; overdue records show a breach.", formula: `${metrics.atRisk} risk records (${metrics.urgentAtRisk} urgent)`, source: "Synthetic request state + demo clock", target: "Open clinical queue" },
    complete: { title: "Complete on arrival", definition: "Requests with all demonstrative service-specific document types at initial or current evaluation.", formula: `${metrics.completeRate}% = complete records ÷ ${metrics.total} records`, source: "Synthetic request state; 72% case baseline [K]", target: "Open provider intake" },
  };
  const detail = details[state.metricFocus] || details.open;
  return `<section class="metric-detail" aria-live="polite"><div><div class="eyebrow">Metric inspection</div><h2 style="margin:5px 0 6px">${detail.title}</h2><p class="definition">${detail.definition}</p></div><div class="formula-box"><strong>Formula & scope</strong><br />${detail.formula}<br /><span class="muted">Source: ${detail.source}</span><br /><button class="text-button" data-action="navigate" data-page="${state.metricFocus === "pend" ? "pend" : state.metricFocus === "complete" ? "submit" : "queue"}">${detail.target}</button></div></section>`;
}
function channelRow(label, sample, baseline, target, type) { return `<div class="channel-row"><strong>${label}</strong><div class="channel-split"><b class="${type}" style="width:${Math.max(3, sample)}%"></b></div><div class="target-mini"><strong>${sample}%</strong>${baseline ? ` · ${baseline}% [C]` : ""}${target ? ` → ${target}% [M]` : ""}</div></div>`; }
function barRow(label, value, max, className = "", display = null) { const width = Math.max(4, Math.min(100, Math.round((value / Math.max(max, 1)) * 100))); return `<div class="bar-group"><div class="bar-label">${label}</div><div class="bar-track"><div class="bar ${className}" style="width:${width}%"></div></div><div class="bar-value">${display || value}</div></div>`; }
function lane(title, count, copy, iconName) { return `<div class="lane"><span class="lane-icon">${icon(iconName)}</span><div><div class="lane-title">${title}</div><div class="lane-copy">${copy}</div></div><div class="lane-count">${count}</div></div>`; }
function alertTimeline(atRisk) {
  const defaults = atRisk.length ? atRisk.map((request) => `<div class="timeline-item alert"><div class="timeline-time">${formatRemaining(timeRemainingHours(request, state.now))}</div><div class="timeline-title">${request.id} · ${escapeHtml(request.service)}</div><div class="timeline-copy">${request.urgency === "urgent" ? "Urgent case needs a clinical decision on the available record by hour 60." : "Day-6 standard case requires team-lead review."} <button class="text-button" data-action="open-request" data-id="${request.id}">Review</button></div></div>`).join("") : `<div class="timeline-item"><div class="timeline-title">No current deadline-risk requests</div><div class="timeline-copy">Advance the demo clock to test escalation behavior.</div></div>`;
  return defaults + `<div class="timeline-item"><div class="timeline-time">Integration</div><div class="timeline-title">St. Anne's is still in test validation</div><div class="timeline-copy">Portal fallback remains configured until acceptance criteria pass.</div></div>`;
}

function submitPage() {
  const requirements = SERVICE_REQUIREMENTS[state.form.service];
  const missing = missingDocuments(state.form.service, state.form.documents);
  return pageHeader("Provider workspace", "Submit a prior-authorization request", "Guided intake checks for the required information before a case enters the clinical queue. The checker is advisory; an office can attest and proceed.", `${dataTag("synthetic", "Synthetic submission")}<button class="button secondary" data-action="launch-scenario" data-scenario="incomplete">Load missing-documents demo</button>`) + `
    <div class="form-layout"><section class="panel"><div class="panel-body"><div class="stepper"><span class="step active"><span class="step-number">1</span>Request</span><span class="step active"><span class="step-number">2</span>Documentation</span><span class="step"><span class="step-number">3</span>Route</span></div>
      <form id="submission-form"><div class="field-grid">
        <div class="field"><label for="member">Member name</label><input id="member" data-form-field="member" value="${escapeHtml(state.form.member)}" placeholder="e.g. Taylor Morgan" required /></div>
        <div class="field"><label for="memberId">Member ID</label><input id="memberId" data-form-field="memberId" value="${escapeHtml(state.form.memberId)}" placeholder="e.g. M-201024" required /></div>
        <div class="field"><label for="provider">Ordering provider</label><input id="provider" data-form-field="provider" value="${escapeHtml(state.form.provider)}" placeholder="e.g. Harbor Orthopedics" required /></div>
        <div class="field"><label for="service">Service</label><select id="service" data-form-field="service">${Object.keys(SERVICE_REQUIREMENTS).map((key) => `<option value="${key}" ${state.form.service === key ? "selected" : ""}>${serviceLabel(key)}</option>`).join("")}</select></div>
        <div class="field"><label for="channel">Submission channel</label><select id="channel" data-form-field="channel"><option value="portal" ${state.form.channel === "portal" ? "selected" : ""}>Provider portal</option><option value="api" ${state.form.channel === "api" ? "selected" : ""}>Connected API</option><option value="fax" ${state.form.channel === "fax" ? "selected" : ""}>Fax / scan</option><option value="phone" ${state.form.channel === "phone" ? "selected" : ""}>Phone intake</option></select></div>
        <div class="field"><label for="coverage">Coverage check</label><select id="coverage" data-form-field="coverage"><option value="covered" ${state.form.coverage === "covered" ? "selected" : ""}>Covered</option><option value="not-covered" ${state.form.coverage === "not-covered" ? "selected" : ""}>Not covered</option></select></div>
        <div class="field"><label for="network">Network check</label><select id="network" data-form-field="network"><option value="in-network" ${state.form.network === "in-network" ? "selected" : ""}>In network</option><option value="out-of-network" ${state.form.network === "out-of-network" ? "selected" : ""}>Out of network</option></select></div>
        <div class="field span-2"><label class="check-row"><input type="checkbox" data-form-field="urgency" ${state.form.urgency === "urgent" ? "checked" : ""} /> <span><strong>Urgent request</strong><br /><span class="helper">Routes straight to a nurse. The 72-hour clock is never paused for completeness.</span></span></label></div>
      </div>
      <div class="divider"></div><h3>Required documentation</h3><p class="helper">Service-specific checks are a demonstrative rule set. Each flag cites the required item; there is no automated clinical decision.</p>
      <div class="check-list">${requirements.map((document) => `<label class="check-row ${state.form.documents.includes(document) ? "ok" : "missing"}"><input type="checkbox" data-document="${escapeHtml(document)}" ${state.form.documents.includes(document) ? "checked" : ""} />${state.form.documents.includes(document) ? icon("check") : icon("file")}<span>${document}</span></label>`).join("")}</div>
      ${missing.length && state.form.urgency !== "urgent" ? `<label class="attestation" style="display:flex;gap:9px;margin-top:11px"><input type="checkbox" data-form-field="attest" ${state.form.attest ? "checked" : ""} /><span><strong>Attest that the information is already present</strong><br />The request remains valid to submit. An attestation creates a coordinator verification task within four business hours; it does not auto-clear the checker flag.</span></label>` : ""}
      <div class="form-actions"><button type="button" class="button secondary" data-action="clear-form">Clear</button><button type="submit" class="button primary">${icon("arrow")}Check & route request</button></div></form></div></section>
      <aside class="stack"><section class="checker-score"><div class="kicker-row"><span class="tag ${missing.length ? "warn" : "ok"}">${missing.length ? `${missing.length} item${missing.length > 1 ? "s" : ""} missing` : "Ready to route"}</span>${dataTag("synthetic", "Demo checker")}</div><h3>Intake checker</h3><p>${missing.length ? "The request can still be submitted. Standard requests route to the pend desk; urgent requests route immediately to a nurse with these findings." : "All demonstrative required document types are present. The request will enter the deadline-first clinical queue."}</p>${missing.length ? `<div class="checker-result"><strong class="helper">Needed before complete clinical review</strong><ul>${missing.map((item) => `<li>${item}</li>`).join("")}</ul></div>` : `<div class="checker-result"><span class="tag ok">Checklist passed</span></div>`}</section>
      <section class="panel"><header class="panel-header"><div><h2>Front-door controls</h2><p>Source-defined routing behavior.</p></div></header><div class="panel-body small-stack">${ruleLine("1", "Coverage & network", "Stops a non-covered or out-of-network order before it is incorrectly treated as a clinical denial.")}${ruleLine("2", "Duplicate check", "Exact matches merge automatically; uncertain matches always need coordinator confirmation.")}${ruleLine("3", "Completeness & urgency", "Urgent requests bypass the hold. Standard incomplete requests go to a coordinator—not a nurse.")}</div></section>
      <section class="panel"><div class="visual-frame"><img src="assets/images/request-lifecycle.svg" alt="Lifecycle of a submitted prior authorization request" /></div></section></aside>
    </div>`;
}

function ruleLine(number, title, copy) { return `<div class="rule-line"><span class="rule-num">${number}</span><div><div class="rule-title">${title}</div><div class="rule-copy">${copy}</div></div>${icon("chevron")}</div>`; }

function pendPage() {
  const items = state.requests.filter((request) => request.status === "pending-information" || request.status === "probable-duplicate");
  return pageHeader("Coordinator workspace", "Pend desk & information completion", "Coordinators own outreach, document verification and ambiguous duplicate confirmation. They cannot issue a clinical denial.", `<button class="button secondary" data-action="open-clock">${icon("clock")}Advance simulation</button>${dataTag("synthetic", `${items.length} open tasks`)}`) + `
    <section class="grid-2"><article class="panel"><header class="panel-header"><div><h2>Coordinator work queue</h2><p>Ordered by the regulatory deadline; standard reminders follow the source-defined schedule.</p></div><span class="tag info">15 planned seats [A]</span></header><div class="panel-body flush"><div class="queue-card queue-head"><div>Request</div><div>Member & service</div><div>Task</div><div>Deadline</div><div>Owner</div><div>Action</div></div>${items.length ? items.map((request) => pendRow(request)).join("") : empty("All information and match-confirmation tasks are complete.")}</div></article>
      <div class="stack"><article class="panel"><header class="panel-header"><div><h2>Follow-up protocol</h2><p>Operational rule—not a clinical decision.</p></div></header><div class="panel-body small-stack">${ruleLine("0", "Same day", "Send an itemised request in the provider’s original channel.")}${ruleLine("24", "Reminder", "Issue a first reminder after 24 hours.")}${ruleLine("48", "Reminder", "Issue a second reminder after 48 hours.")}${ruleLine("4", "Coordinator call", "Escalate an unanswered standard request on day 4.")}${ruleLine("6", "Decision readiness", "Team lead reviews at-risk standard requests; nurse decides on available record if needed.")}</div></article>
        <article class="panel"><header class="panel-header"><div><h2>How the pend desk protects clinical capacity</h2><p>Clerical follow-up is visibly separate from clinical judgment.</p></div></header><div class="visual-frame"><img src="assets/images/pend-desk-flow.svg" alt="Coordinator workflow moving incomplete request work away from nurses" /></div></article>
        <article class="panel"><header class="panel-header"><div><h2>Staffing context</h2><p>Planning assumption, not measured performance.</p></div>${dataTag("model", "[A]")}</header><div class="panel-body"><div class="chart">${barRow("Planned seats", 15, 45, "", "15")}${barRow("Ramp target", 35, 45, "purple", "35")}${barRow("Maximum week 9", 45, 45, "amber", "45")}</div><div class="notice">The case treats 15,402 monthly nurse-hours as attributable incomplete-request workload—not automatically recoverable capacity.</div></div></article></div></section>`;
}

function pendRow(request) {
  const task = request.status === "probable-duplicate" ? "Confirm probable duplicate" : `Obtain: ${request.missing.join(", ")}`;
  return `<div class="queue-card"><div class="request-id">${request.id}</div><div><div class="name">${escapeHtml(request.member)}</div><div class="service">${escapeHtml(request.service)} · ${escapeHtml(request.provider)}</div></div><div>${task}</div><div class="countdown ${riskFor(request, state.now).level}">${formatRemaining(timeRemainingHours(request, state.now))}</div><div>${escapeHtml(request.assignedTo || "Unassigned")}</div><div class="action-row">${request.status === "probable-duplicate" ? `<button class="text-button" data-action="confirm-duplicate" data-id="${request.id}">Confirm</button><button class="text-button" data-action="reject-duplicate" data-id="${request.id}">Reject</button>` : `<button class="text-button" data-action="send-reminder" data-id="${request.id}">Remind</button><button class="text-button" data-action="mark-docs" data-id="${request.id}">Docs received</button>`}<button class="text-button" data-action="open-request" data-id="${request.id}">Open</button></div></div>`;
}

function queuePage() {
  const queue = deadlineOrder(state.requests, state.now);
  return pageHeader("Reviewer workspace", "Deadline-first clinical workbench", "Complete cases enter review; any possible denial remains under clinician control. The queue uses only the time remaining on the regulatory clock.", `<button class="button secondary" data-action="open-clock">${icon("clock")}Demo clock</button><span class="pill case">7-day standard · 72-hour urgent [C]</span>`) + `
    ${queue.some((request) => riskFor(request, state.now).level === "critical") ? `<div class="alert-strip">${icon("alert")}<div><strong>Deadline-first escalation active.</strong> Do not reorder cases by provider value, member segment, line of business or predicted outcome.</div></div>` : ""}
    <section class="panel"><header class="panel-header"><div><h2>Assigned queue</h2><p>Sorted by deadline. Details include source-linked demo evidence, required checklists and decision templates.</p></div><span class="tag info">${queue.length} open cases</span></header><div class="panel-body flush"><div class="queue-card queue-head"><div>Request</div><div>Member & service</div><div>Channel</div><div>Ownership</div><div>Time remaining</div><div>Review</div></div>${queue.length ? queue.map((request) => queueRow(request)).join("") : empty("No cases currently require clinical review.")}</div></section>
    <section class="grid-equal" style="margin-top:18px"><article class="panel"><header class="panel-header"><div><h2>Every denial carries a reason</h2><p>Specific criterion and corrective information are captured in the clinical decision drawer.</p></div></header><div class="panel-body"><div class="notice">For imaging, physical therapy and medical equipment, the prototype requires a second clinician review before a clinical denial. A disagreement would require simulated physician sign-off.</div></div></article><article class="panel"><header class="panel-header"><div><h2>Urgent pathway</h2><p>Urgent cases never wait on completeness.</p></div></header><div class="panel-body"><div class="small-stack">${ruleLine("4h", "Assignment", "Urgent requests must receive a nurse owner within four hours.")}${ruleLine("48h", "Team lead", "Undecided urgent cases escalate to the team lead.")}${ruleLine("60h", "Available record", "Decision is made on the available record; escalation includes the UM director and on-call physician.")}</div></div></article></section>`;
}

function queueRow(request) {
  const risk = riskFor(request, state.now).level;
  return `<div class="queue-card"><div class="request-id">${request.id}</div><div><div class="name">${escapeHtml(request.member)}</div><div class="service">${escapeHtml(request.service)} · ${request.urgency === "urgent" ? "Urgent" : "Standard"}</div></div><div>${statusTag(request.status)}<div class="service">${titleCase(request.channel)}</div></div><div>${escapeHtml(request.assignedTo || "Unassigned")}</div><div class="countdown ${risk}">${formatRemaining(timeRemainingHours(request, state.now))}</div><div class="action-row">${riskTag(request)}<button class="text-button" data-action="open-request" data-id="${request.id}">Review</button></div></div>`;
}

function integrationPage() {
  const selected = state.selectedIntegration;
  const connection = state.integrationState[selected];
  const integrations = [
    { name: "Evergreen Health System", requests: "6,900 / month", adoption: 72, pend: "13.2%", test: "Dec 18, 08:18 CT", color: "ok" },
    { name: "St. Anne's Medical Group", requests: "4,700 / month", adoption: 38, pend: "18.1%", test: "Dec 17, 15:42 CT", color: "warn" },
  ];
  const apiSample = state.apiResponse || apiTemplate(selected, connection);
  return pageHeader("Provider-network workspace", "Hospital-group API onboarding", "A simulated connection workbench for the two named strategic accounts. This is a local demonstration contract—not a production FHIR or Da Vinci endpoint.", `${dataTag("synthetic", "Local mock endpoint")}<span class="pill model">80% adoption target [R]</span>`) + `
    <div class="api-layout"><aside><div class="eyebrow" style="margin-bottom:10px">Provider groups</div>${integrations.map((integration) => `<article class="integration-card ${selected === integration.name ? "active" : ""}" data-action="select-integration" data-name="${integration.name}"><div class="inline"><span class="tag ${integration.color}">${state.integrationState[integration.name] === "connected" ? "Connected" : state.integrationState[integration.name] === "outage" ? "Fallback active" : "Testing"}</span></div><h3>${integration.name}</h3><p>${integration.requests} • last test ${integration.test}</p><div class="progress-track"><span style="width:${integration.adoption}%"></span></div><div class="inline" style="justify-content:space-between;margin-top:7px"><span class="helper">API volume</span><strong class="compact">${integration.adoption}%</strong></div></article>`).join("")}</aside>
      <section class="stack"><article class="panel"><header class="panel-header"><div><h2>${selected}</h2><p>Connection state: <strong>${connection === "connected" ? "Connected" : connection === "outage" ? "Degraded — portal fallback active" : "Test validation"}</strong></p></div>${connection === "outage" ? `<span class="tag risk">Fallback active</span>` : `<span class="tag ok">Mock TLS channel</span>`}</header><div class="panel-body"><div class="grid-equal"><div><h3>Integration acceptance view</h3><div class="criterion-list" style="margin-top:12px"><div class="criterion"><span>Meaningful rejected-message response<small>Demonstrated by local mock response</small></span><span class="tag ok">Ready</span></div><div class="criterion"><span>Auditable request-response history<small>Stored in synthetic event stream</small></span><span class="tag ok">Ready</span></div><div class="criterion"><span>Portal fallback<small>Operator-triggered during service degradation</small></span><span class="tag ${connection === "outage" ? "warn" : "ok"}">${connection === "outage" ? "Active" : "Configured"}</span></div><div class="criterion"><span>30-day adoption and pend-rate check<small>Source-proposed launch criterion</small></span><span class="tag warn">Pending</span></div></div></div><div><h3>Test operations</h3><div class="small-stack" style="margin-top:12px"><button class="button primary" data-action="api-submit" ${state.apiPending ? "disabled" : ""}>${icon("arrow")}${state.apiPending ? "Routing sample…" : "Submit valid sample"}</button><button class="button secondary" data-action="api-invalid">${icon("alert")}Send invalid sample</button>${connection === "outage" ? `<button class="button aqua" data-action="api-recover">${icon("refresh")}Recover connection</button>` : `<button class="button secondary" data-action="api-outage">${icon("alert")}Simulate outage & fallback</button>`}<button class="button secondary" data-action="api-status">${icon("search")}Query PA-24021 status</button></div></div></div></div></article>
        <article class="panel"><header class="panel-header"><div><h2>Electronic request sequence</h2><p>Request ID, validation, status and fallback are visible to the provider.</p></div></header><div class="visual-frame"><img src="assets/images/api-sequence.svg" alt="Hospital API integration sequence with acknowledgement, status query and portal fallback" /></div></article>
        <article class="panel"><header class="panel-header"><div><h2>Mock request / response</h2><p>Versioned demonstrative contract: <code>complete-first/v0.1</code></p></div>${dataTag("synthetic", "Payload")}</header><div class="panel-body">${state.apiPending ? `<div class="code-block load-shimmer" aria-label="Simulating API routing"></div>` : `<pre class="code-block">${escapeHtml(JSON.stringify(apiSample, null, 2))}</pre>`}<div class="api-status"><strong>What this demonstrates</strong>Every acknowledgement includes a request ID and a permissible state. The product distinguishes approved, denied-with-specific-reason, and pended-for-information; a local API simulator cannot establish production interoperability.</div></div></article></section>
    </div>`;
}

function apiTemplate(group, connection) { return { contract: "complete-first/v0.1", group, request: { memberId: "M-200981", serviceCode: "97110", channel: "api" }, response: connection === "outage" ? { status: 503, state: "portal_fallback", detail: "Simulated connection failure; provider can submit through the portal." } : { status: 202, requestId: "PA-24021", state: "in_review", expectedDecisionBy: "2026-12-24T10:00:00Z", duplicateCheck: "clear", documentCheck: "complete" } }; }

function governancePage() {
  const gateRows = [
    ["Input remediation", "ZIP removed; claims-history proxy replaced with documented clinical evidence", "Complete in demo fixture", "ok"],
    ["Clinical validity", "≤0.5% observed inappropriate approvals; upper 95% bound ≤1%", "No labelled clinical validation set", "warn"],
    ["Blinded sample", "≥1,170 approve-band cases per line of business", "Synthetic sample only", "warn"],
    ["Error parity", "No group false non-approval rate >5 points above best group", "Illustrative snapshot only", "warn"],
    ["Approval opportunity", "Adjusted Medicaid/employer and Medicare/employer gap ≤2 points", "Medicaid gap not established", "risk"],
    ["Stability", "12+ weeks shadow mode; PSI <0.1; calibrated", "11 simulated weeks complete", "warn"],
    ["Operations", "Kill switch, fail-safe routing, staffed audit workflow", state.aiKillSwitchTested ? "Kill switch drill recorded" : "Kill switch drill outstanding", state.aiKillSwitchTested ? "ok" : "warn"],
  ];
  return pageHeader("Governance workspace", "Safety, gold-card & release readiness", "Gold-card and AI are gated future options. They are presented here as controllable, auditable decisions—not live production capabilities.", `${dataTag("synthetic", "Evidence fixture")}<span class="pill model">G3/G4 roadmap gates [R]</span>`) + `
    <section class="readiness-grid"><div class="stack"><article class="panel"><header class="panel-header"><div><h2>AI G4 release gate</h2><p>Every required criterion must pass before the simulator can make AI auto-approval eligible.</p></div><span class="tag risk">Blocked · shadow mode only</span></header><div class="panel-body flush"><div class="table-wrap"><table class="gate-table"><thead><tr><th>Gate criterion</th><th>Threshold</th><th>Demo evidence</th><th>State</th></tr></thead><tbody>${gateRows.map(([criterion, threshold, evidence, status]) => `<tr><td>${criterion}</td><td>${threshold}</td><td class="evidence">${evidence}</td><td><span class="tag ${status}">${status === "ok" ? "Passed" : status === "risk" ? "Failed" : "Unverified"}</span></td></tr>`).join("")}</tbody></table></div></div></article>
      <article class="panel"><header class="panel-header"><div><h2>Safety-gate journey</h2><p>Future-state controls with an explicit fail-safe outcome.</p></div><span class="tag risk">Gate blocked</span></header><div class="visual-frame"><img src="assets/images/ai-gate.svg" alt="AI remediation, shadow mode, validation, fairness and G4 gate process leading to a fail-safe nurse route if it fails" /></div></article>
      <article class="panel"><header class="panel-header"><div><h2>Shadow-mode evaluation</h2><p>Models may observe synthetic cases without changing their workflow outcome.</p></div>${dataTag("synthetic", "No clinical validation")}</header><div class="panel-body"><div class="table-wrap"><table class="data-table"><thead><tr><th>Case</th><th>Scope</th><th>Model output</th><th>Human reference</th><th>Outcome</th></tr></thead><tbody><tr><td class="request-id">SH-0181</td><td>Imaging · complete</td><td><span class="tag ok">Approval band</span></td><td>Approved</td><td><span class="tag ok">Aligned</span></td></tr><tr><td class="request-id">SH-0182</td><td>PT · Medicaid</td><td><span class="tag warn">Out of scope</span></td><td>Pending evidence</td><td><span class="tag info">Nurse route</span></td></tr><tr><td class="request-id">SH-0183</td><td>Urgent imaging</td><td><span class="tag warn">Excluded</span></td><td>In review</td><td><span class="tag info">Nurse route</span></td></tr></tbody></table></div><div class="notice" style="margin-top:14px">No “likely deny” signal is shown. A possible denial, incomplete input, urgent request, out-of-scope service or failed dependency routes to a human workflow.</div></div></article></div>
      <aside class="stack"><section class="mode-banner"><span class="tag ${state.aiManualRouting ? "risk" : "pending"}">${state.aiManualRouting ? "Fail-safe manual routing" : "Shadow mode"}</span><h3>${state.aiManualRouting ? "Kill switch active" : "AI is not live"}</h3><p>${state.aiManualRouting ? "A synthetic operational drill has routed every applicable model candidate to the nurse queue. The release gate remains blocked and no automatic approval can occur." : "Current demonstrated state: 11 of 12 minimum shadow weeks. The application cannot enable auto-approval while gate evidence is unverified or failed."}</p><button class="button primary" disabled>${icon("shield")}Auto-approval unavailable</button><button class="button secondary" data-action="test-kill-switch">${icon("alert")}${state.aiKillSwitchTested ? "Kill-switch drill recorded" : "Run kill-switch drill"}</button></section>
        <article class="panel"><header class="panel-header"><div><h2>Gold-card phase 1</h2><p>Imaging and PT only, after G3.</p></div><span class="tag warn">Proposed</span></header><div class="panel-body"><div class="criterion-list"><div class="criterion"><span>Evergreen imaging · 12-month approval<small>≥97% required</small></span><span class="tag ok">97.8%</span></div><div class="criterion"><span>Evergreen imaging · service volume<small>≥300 requests required</small></span><span class="tag ok">1,240</span></div><div class="criterion"><span>Evergreen imaging · completeness<small>≥90% required</small></span><span class="tag ok">93.1%</span></div><div class="criterion"><span>Evergreen imaging · integrity evidence<small>No open concern or adverse finding</small></span><span class="tag warn">Not yet evaluable</span></div><div class="criterion"><span>Lakeview PT · trailing approval<small>≥97% required</small></span><span class="tag risk">95.4% · fails</span></div></div><div class="notice" style="margin-top:14px">One group remains unevaluable and one fails the threshold. No status is granted by a click; even authorised requests retain eligibility, coverage, network and duplicate checks with a 5% audit.</div></div></article>
        <article class="panel"><header class="panel-header"><div><h2>Monitoring triggers</h2><p>Post-launch controls in the source plan.</p></div></header><div class="panel-body small-stack">${ruleLine("8", "Early warning", "Confirmed inappropriate approvals in a month trigger threshold investigation.")}${ruleLine("11", "Kill switch", "At least 11 confirmed inappropriate approvals in ~995 audits or any serious-harm event routes traffic to nurses.")}${ruleLine(".2", "Drift fail-safe", "Population stability index above 0.2 sends traffic back to nurses and requires revalidation.")}</div></article></aside>
    </section>`;
}

function insightsPage() {
  const metrics = deriveMetrics(state.requests, state.now, state.metricChannel);
  const standardAtRisk = state.requests.filter((request) => request.open && request.urgency === "standard" && ["critical", "late"].includes(riskFor(request, state.now).level)).length;
  return pageHeader("Measurement workspace", "Performance, quality & release evidence", "Operational measurements stay tied to the same request state. Case baselines and model outputs remain visually separate from the simulation.", `${dataTag("synthetic", "Live demo metrics")}<select class="filter-select" data-input="metric-channel"><option value="all">All channels</option><option value="api" ${state.metricChannel === "api" ? "selected" : ""}>API</option><option value="portal" ${state.metricChannel === "portal" ? "selected" : ""}>Portal</option><option value="fax" ${state.metricChannel === "fax" ? "selected" : ""}>Fax</option></select>`) + `
    <section class="visual-grid"><article class="panel"><header class="panel-header"><div><h2>Channel mix and migration</h2><p>Small bold bars reflect the selected synthetic record set; case and target labels supply context.</p></div>${dataTag("model", "[C] [M]")}</header><div class="panel-body"><div class="channel-bars">${channelRow("API", metrics.apiRate, 8.2, 25, "api")}${channelRow("Portal", Math.round(state.requests.filter((item) => item.channel === "portal").length / Math.max(state.requests.length, 1) * 100), 0, 0, "portal")}${channelRow("Fax", metrics.faxRate, 45, 32, "fax")}${channelRow("Phone", 0, 0, 0, "phone")}</div><div class="notice" style="margin-top:16px">The solution targets API share ≥25% by March. Portal is the defined fallback while provider connectivity is being proven.</div></div></article>
    <article class="panel"><header class="panel-header"><div><h2>Queue & deadline exposure</h2><p>Controlled by the request clock, status and urgency—not commercial priority.</p></div>${dataTag("synthetic", "Simulation")}</header><div class="panel-body"><div class="chart">${barRow("Urgent ≤12h", metrics.urgentAtRisk, 3, "red")}${barRow("Standard day 6", standardAtRisk, 4, "amber")}${barRow("Clinical review", metrics.clinical, 7, "purple")}${barRow("Info completion", metrics.pending, 7, "")}</div><div class="notice" style="margin-top:15px">Urgent: 72 hours. Standard: 7 calendar days. Any breach gets a required cause record in the demonstration.</div></div></article></section>
    <section class="visual-grid"><article class="panel"><header class="panel-header"><div><h2>Completeness & rework</h2><p>Why the pend desk is an operating lever rather than a call-centre layer.</p></div>${dataTag("model", "[K] [A]")}</header><div class="visual-frame"><img src="assets/images/pend-desk-flow.svg" alt="Diagram of the pend desk moving documentation follow up from nurses" /></div></article>
    <article class="panel"><header class="panel-header"><div><h2>Denial-quality bridge</h2><p>Planning decomposition, not a measured outcome.</p></div>${dataTag("model", "[M]")}</header><div class="panel-body"><div class="bridge"><div class="bridge-step"><span class="bridge-value">17.0%</span><div class="bridge-block" style="height:124px"></div><span class="bridge-caption">Baseline</span></div><div class="bridge-step"><span class="bridge-value">−4.15</span><div class="bridge-block negative" style="height:82px"></div><span class="bridge-caption">Missing documentation prevention</span></div><div class="bridge-step"><span class="bridge-value">−0.79</span><div class="bridge-block negative" style="height:47px"></div><span class="bridge-caption">Duplicate merge</span></div><div class="bridge-step"><span class="bridge-value">−0.86</span><div class="bridge-block warning" style="height:52px"></div><span class="bridge-caption">Order-time interception</span></div><div class="bridge-step"><span class="bridge-value">11.2%</span><div class="bridge-block" style="height:68px"></div><span class="bridge-caption">Modelled rate</span></div></div><p class="helper" style="margin:15px 0 0">Clinical-guideline denial rates are a guardrail; prevention is not shown as a better clinical decision.</p></div></article></section>
    <section class="visual-grid"><article class="panel"><header class="panel-header"><div><h2>On-time trajectory</h2><p>Case baseline, proposed threshold and modelled reference are intentionally distinct series.</p></div>${dataTag("model", "[C] [M]")}</header><div class="panel-body"><div class="chart">${barRow("Sep baseline", 80, 100, "amber", "80.0% [C]")}${barRow("Jan interim milestone", 90, 100, "purple", "≥90% [M]")}${barRow("Mar reference", 91.5, 100, "", "91.5% [M]")}${barRow("Sep 2027 target", 92, 100, "purple", "≥92% [M]")}</div><div class="notice" style="margin-top:15px">The regulatory objective is every request on time. These figures are interim commitments and model output, not compliance claims.</div></div></article>
    <article class="panel"><header class="panel-header"><div><h2>AI fairness & safety evidence</h2><p>Illustrative, synthetic observations never establish clinical fairness.</p></div>${dataTag("synthetic", "Evidence fixture")}</header><div class="panel-body"><div class="chart">${barRow("Employer opportunity gap", 1.2, 5, "", "1.2 pp")}${barRow("Medicare opportunity gap", 1.7, 5, "purple", "1.7 pp")}${barRow("Medicaid opportunity gap", 3.4, 5, "red", "3.4 pp · fails")}${barRow("Projected time gap", .7, 1, "amber", "0.7d · fails")}</div><div class="notice" style="margin-top:15px">Pre-launch requirement: adjusted gap ≤2 points, upper 95% confidence bound ≤3 points, and time gap ≤0.5 day. This fixture therefore remains blocked.</div></div></article></section>
    <section class="panel section-spacer"><header class="panel-header"><div><h2>Release evidence timeline</h2><p>Gates protect scope and prevent unsupported automation.</p></div><button class="text-button" data-action="navigate" data-page="governance">Inspect G4</button></header><div class="panel-body"><div class="roadmap"><div class="gate"><strong>G1 · Nov 27</strong>Deadline queue and capacity evidence</div><div class="gate"><strong>G2 · Dec 22</strong>Four-MVP exit criteria</div><div class="gate"><strong>G3 · Jan 4</strong>Gold-card gate</div><div class="gate"><strong>G4 · Mar 1</strong>AI release evidence</div><div class="gate"><strong>G5 · Apr</strong>Funding & rollout</div></div></div></section>`;
}

function financialPage() {
  const rate = Number(state.financialAppealRate);
  const completeFirst = 7.36 - (0.148 * rate);
  const delta = completeFirst - 3.49;
  const comparison = delta <= 0 ? `Complete-First is modelled $${Math.abs(delta).toFixed(2)}M lower than hiring 40 nurses at this rate.` : `Complete-First is modelled $${delta.toFixed(2)}M higher than hiring 40 nurses at this rate.`;
  return pageHeader("Scenario view", "Twelve-month financial comparison", "A transparent planning model based on the supplied solution. Released clinical capacity is not treated as cash, and appeal rate remains an explicit assumption.", `${dataTag("model", "[M] planning output")}<button class="button secondary" data-action="navigate" data-page="insights">${icon("activity")}Operational evidence</button>`) + `
    <section class="product-hero" style="min-height:250px"><div class="hero-copy"><div class="hero-kicker">Assumption stress test</div><h2>Appeal rate changes the cash comparison.</h2><p>The core operating recommendation rests on timeliness, denial quality and electronic readiness; this scenario isolates the stated appeal-rate assumption.</p><div class="hero-stat-row"><div class="hero-stat"><strong>${rate}%</strong><span>appeal-rate assumption</span></div><div class="hero-stat"><strong>$${completeFirst.toFixed(2)}M</strong><span>Complete-First 12m net cash</span></div><div class="hero-stat"><strong>$3.49M</strong><span>40 nurses 12m cash</span></div></div></div><figure class="hero-illustration"><img src="assets/images/request-lifecycle.svg" alt="Request lifecycle supporting the operational business case" /></figure></section>
    <section class="grid-equal"><article class="panel"><header class="panel-header"><div><h2>Appeal-rate scenario</h2><p>Use the stated 10%–30% sensitivity interval.</p></div></header><div class="panel-body"><label class="field"><span>Appeal rate: <strong>${rate}%</strong> <span class="helper">[A]</span></span><input type="range" min="10" max="30" step="1" value="${rate}" data-input="financial-appeal" /></label><div class="chart" style="margin-top:23px">${barRow("Complete-First", completeFirst, 6.5, "purple", `$${completeFirst.toFixed(2)}M`) }${barRow("Hire 40 nurses", 3.49, 6.5, "amber", "$3.49M")}</div><div class="notice" style="margin-top:17px">At 10% / 20% / 30% appeal rate, supplied plan values are $5.88M / $4.40M / $2.92M for Complete-First. The value shown between points is a linear demo interpolation.</div></div></article>
    <article class="panel"><header class="panel-header"><div><h2>Decision interpretation</h2><p>Use alongside—not instead of—the operational release gates.</p></div></header><div class="panel-body"><div class="success-banner">${icon("activity")}<div><strong>${comparison}</strong><br />The supplied model indicates the twelve-month comparison switches at approximately 26% appeal rate.</div></div><div class="divider"></div><div class="criterion-list"><div class="criterion"><span>Six-month programme cost<small>Budget cap: $4.2M, plan: $4.19M</small></span><strong>$4.19M [M]</strong></div><div class="criterion"><span>Twelve-month programme cost<small>Core programme</small></span><strong>$6.47M [M]</strong></div><div class="criterion"><span>Run-rate comparison<small>At 20% appeal rate</small></span><strong>$10.08M vs $11.64M [M]</strong></div><div class="criterion"><span>Interpretation boundary<small>Capacity released is not cash unless it replaces hiring</small></span><strong>Guardrail</strong></div></div></div></article></section>
    <section class="panel section-spacer"><header class="panel-header"><div><h2>What this model cannot establish</h2><p>Limitations preserved from the business solution.</p></div></header><div class="panel-body"><div class="grid-equal"><div class="notice"><strong>Not a promise.</strong><br />Appeal rate, avoidable share of processing cost and the split of clerical versus clinical rework require request-level data. They are planning assumptions, not measured results.</div><div class="notice"><strong>Not a reason to disable safeguards.</strong><br />AI remains optional and gate-controlled. The January commitment does not depend on auto-approval; clinicians remain accountable for every possible denial.</div></div></div></section>`;
}

function judgePage() {
  const scenarios = [
    ["incomplete", "1. Complete-first intake", "Detect missing standard documentation and route to pend desk."],
    ["attestation", "2. False-alert attestation", "Provider attests; coordinator verifies without auto-clearing."],
    ["exact", "3. Exact duplicate", "Inspect merge then restore original clock with unmerge."],
    ["probable", "4. Probable duplicate", "Hold for coordinator confirmation while both clocks run."],
    ["urgent", "5. Urgent incomplete", "Bypass completeness hold and inspect escalation control."],
    ["breach", "6. Deadline breach", "Advance to a breach and inspect root-cause record."],
    ["reopen", "7. Missing-doc reopening", "Start the 72-hour reopening pathway on original request."],
    ["api", "8. API fallback", "Simulate failure, inspect 503 response and portal fallback."],
    ["gold", "9. Gold-card evidence", "Compare eligible, failed and unevaluable evidence states."],
    ["gate", "10. AI gate failure", "See failed/unverified gate evidence block automation."],
    ["kill", "11. AI kill switch", "Record fail-safe nurse routing incident."],
    ["stress", "12. Workload stress", "Advance queue pressure and surface operational alert."],
  ];
  const selected = scenarios.find(([id]) => id === state.scenarioSelected) || scenarios[0];
  const scenarioContent = {
    incomplete: ["Correct an incomplete standard request", "A request arrives without conservative-therapy documentation. Submit it to see the deterministic checker create a pend-desk task, then mark records received to move it into clinical review.", ["Submit incomplete record", "Open pend task", "Verify and route"], "submit"],
    attestation: ["Handle a disputed checker flag", "The provider says the missing item is in the attachment. The product preserves the alert and creates a coordinator-verification task instead of treating an attestation as a clean record.", ["Open PA-24018", "Review attestation", "Coordinator verifies"], "pend"],
    exact: ["Trace an exact duplicate", "PA-24030 was matched by member, service code, ordering provider, open status and 30-day window. Inspect its audit trail or unmerge it to restore its original clock.", ["Open audit", "Inspect merge rule", "Unmerge"], "audit"],
    probable: ["Keep a possible duplicate accountable", "PA-24031 shares member and service family but differs in code or site. The coordinator, not automation, confirms or rejects it while both clocks continue.", ["Open pend desk", "Review PA-24031", "Confirm or reject"], "pend"],
    urgent: ["Route an urgent incomplete request", "PA-24023 carries a 72-hour clock and never sits in an information hold. It moves to the urgent nurse lane with its missing-document findings attached.", ["Open clinical queue", "Inspect PA-24023", "Advance time"], "queue"],
    breach: ["Make a late decision visible", "The accelerated clock runs scheduled rules and logs a breach investigation; it does not simply change a display timer.", ["Open demo clock", "Advance past deadline", "Inspect audit"], "queue"],
    reopen: ["Reopen an eligible missing-doc denial", "PA-24015 carries a qualifying missing-documentation denial. Reopening preserves history and starts a 72-hour decision pathway.", ["Open audit", "Choose reopen", "Inspect new clock"], "audit"],
    api: ["Test a safe integration failure", "The local mock endpoint returns an inspectable 503 response and keeps a portal fallback configured. No live partner connection is claimed.", ["Open API workbench", "Simulate outage", "Recover connection"], "integrations"],
    gold: ["Evaluate gold-card evidence", "The console shows a proposed qualifying group, a failed group and an unevaluable integrity check. No button grants a status.", ["Open readiness", "Compare evidence", "Inspect audit control"], "governance"],
    gate: ["Keep AI release fail-closed", "The synthetic fixture shows incomplete clinical validation, insufficient fairness evidence and 11 rather than 12 shadow weeks. Auto-approval remains disabled.", ["Open G4", "Inspect failed evidence", "Confirm block"], "governance"],
    kill: ["Prove the fail-safe", "Record a synthetic kill-switch drill. The gate remains blocked, and all model traffic stays in human clinical routing.", ["Open readiness", "Run drill", "Inspect incident"], "governance"],
    stress: ["Surface workload pressure", "Advance the simulation to trigger day-6, urgent or breach handling. Dashboard alerts and request histories update from shared state.", ["Open clock", "Advance 48 hours", "Review alerts"], "dashboard"],
  }[selected[0]];
  return pageHeader("Guided demo", "Judge mode", "A reproducible route through the connected product. Each launch opens the actual workspace and preserves a resettable synthetic scenario.", `<button class="button secondary" data-action="reset-demo">${icon("refresh")}Reset all demo state</button><span class="pill synthetic">Seeded fixture</span>`) + `
    <section class="scenario-lab"><aside class="scenario-list">${scenarios.map(([id, title, copy]) => `<button class="scenario-card ${id === state.scenarioSelected ? "active" : ""}" data-action="select-scenario" data-scenario="${id}"><strong>${title}</strong><span>${copy}</span></button>`).join("")}</aside><article class="scenario-stage"><div class="eyebrow">Scenario ${selected[0]}</div><h2>${scenarioContent[0]}</h2><p>${scenarioContent[1]}</p><div class="scenario-steps">${scenarioContent[2].map((item, index) => `<div class="scenario-step"><b>Step ${index + 1}</b><span>${item}</span></div>`).join("")}</div><button class="button primary" data-action="launch-scenario" data-scenario="${selected[0]}">${icon("arrow")}Launch this scenario</button><div class="notice" style="position:relative;margin-top:19px">All named people, request records, endpoints, messages and AI evidence are synthetic. Case baselines and model values retain their source labels.</div></article></section>
    <section class="panel section-spacer"><header class="panel-header"><div><h2>What judges can verify</h2><p>Shared state connects workspaces; reset reproduces the seeded experience.</p></div></header><div class="panel-body"><div class="grid-equal"><div class="small-stack">${ruleLine("A", "Workflow integrity", "Submit, route, complete, review, decide, merge, unmerge and reopen records from the same data state.")}${ruleLine("B", "Safety controls", "See AI fail closed, run a kill-switch drill, and retain clinician control for every possible denial.")}</div><div class="small-stack">${ruleLine("C", "Operational controls", "Run the accelerated clock and inspect deadline-driven alerts, escalation events and required breach records.")}${ruleLine("D", "Integration boundary", "Exercise local request, status, rejected-message and fallback flows without claiming production connectivity.")}</div></div></div></section>`;
}

function auditPage() {
  const selected = state.selectedRequest ? requestById(state.selectedRequest) : state.requests[0];
  const merged = state.requests.filter((request) => request.status === "merged");
  const probable = state.requests.filter((request) => request.status === "probable-duplicate");
  const reopen = state.requests.filter((request) => request.reopenEligible && !request.reopened);
  return pageHeader("Traceability workspace", "Request status, controls & audit trail", "A unified request ID keeps status, deadlines, notices, duplicate controls and decisions traceable across channels.", `<select class="filter-select" data-input="audit-select">${state.requests.map((request) => `<option value="${request.id}" ${selected?.id === request.id ? "selected" : ""}>${request.id} · ${request.member}</option>`).join("")}</select><button class="button secondary" data-action="open-request" data-id="${selected?.id}">${icon("external")}Open detail</button>`) + `
    <section class="grid-2"><article class="panel"><header class="panel-header"><div><h2>${selected?.id} · ${escapeHtml(selected?.member || "")}</h2><p>${escapeHtml(selected?.service || "")} · ${titleCase(selected?.channel || "")}</p></div>${statusTag(selected?.status || "")}</header><div class="panel-body"><div class="detail-grid"><div class="detail-cell"><label>Expected decision</label>${selected?.open ? toLocalTime(selected.deadline) + " CT" : selected?.decisionAt ? toLocalTime(selected.decisionAt) + " CT" : "Closed"}</div><div class="detail-cell"><label>Time / clock</label>${selected?.open ? formatRemaining(timeRemainingHours(selected, state.now)) : "Closed"}</div><div class="detail-cell"><label>Routing lane</label>${titleCase(selected?.lane || "")}</div><div class="detail-cell"><label>Accountable role</label>${escapeHtml(selected?.assignedTo || (selected?.status === "denied" ? "Named clinician" : "System route"))}</div></div><h3>Event history</h3><div class="timeline">${(selected?.events || []).map((event, index) => `<div class="timeline-item ${index === 0 ? "alert" : ""}"><div class="timeline-time">Demo event</div><div class="timeline-title">${escapeHtml(event)}</div></div>`).join("")}${(selected?.notices || []).map((notice) => `<div class="timeline-item"><div class="timeline-time">Notice</div><div class="timeline-copy">${escapeHtml(notice)}</div></div>`).join("")}</div></div></article>
      <aside class="stack"><article class="panel"><header class="panel-header"><div><h2>Duplicate controls</h2><p>Exact automatic merge vs. human confirmation.</p></div></header><div class="panel-body small-stack">${merged.map((request) => `<div class="activity-row"><span class="activity-icon">${icon("merge")}</span><div><div class="activity-title">${request.id} merged into ${request.duplicateOf}</div><div class="activity-copy">Exact match; original clock preserved and documents attached.</div></div><button class="text-button" data-action="unmerge" data-id="${request.id}">Unmerge</button></div>`).join("")}${probable.map((request) => `<div class="activity-row"><span class="activity-icon">${icon("alert")}</span><div><div class="activity-title">${request.id} awaits human confirmation</div><div class="activity-copy">Different code or site; both clocks remain active.</div></div><button class="text-button" data-action="open-request" data-id="${request.id}">Review</button></div>`).join("")}</div></article>
        <article class="panel"><header class="panel-header"><div><h2>Reopen pathway</h2><p>Within 14 days for missing-documentation denials.</p></div></header><div class="panel-body">${reopen.length ? reopen.map((request) => `<div class="activity-row"><span class="activity-icon">${icon("refresh")}</span><div><div class="activity-title">${request.id} · ${escapeHtml(request.member)}</div><div class="activity-copy">${escapeHtml(request.denialReason)}. A qualifying submission starts a 72-hour reopening clock.</div></div><button class="text-button" data-action="reopen" data-id="${request.id}">Reopen</button></div>`).join("") : `<div class="empty-state">No qualifying reopen requests remain.</div>`}</div></article>
        <article class="panel"><header class="panel-header"><div><h2>Simulated communications</h2><p>Visible in the record; nothing is sent externally.</p></div></header><div class="panel-body"><div class="notice"><strong>Request received</strong><br />“We received ${selected?.id}. Expected decision: ${selected?.open ? toLocalTime(selected.deadline) + " CT" : "completed"}.”</div></div></article></aside>
    </section>`;
}

function empty(message) { return `<div class="empty-state">${icon("check")}${message}</div>`; }

function renderDrawer() {
  const request = requestById(state.selectedRequest);
  if (!request) return "";
  const risk = riskFor(request, state.now);
  const requiresSecond = ["imaging", "physicalTherapy", "equipment"].includes(request.serviceFamily);
  const secondDone = Boolean(state.secondReview[request.id]);
  const canDecide = request.open && request.status === "clinical-review";
  return `<div class="modal-backdrop" data-action="close-drawer"><aside class="drawer" role="dialog" aria-modal="true" aria-label="Request details" data-drawer><header class="drawer-header"><div><div class="eyebrow">Request detail</div><div class="request-title">${request.id}</div><div class="inline">${statusTag(request.status)}${riskTag(request)}${dataTag("synthetic", "Demo record")}</div></div><button class="close-button" aria-label="Close request detail" data-action="close-drawer">×</button></header>
    <div class="detail-grid"><div class="detail-cell"><label>Member</label>${escapeHtml(request.member)}<br /><span class="muted">${escapeHtml(request.memberId)}</span></div><div class="detail-cell"><label>Service</label>${escapeHtml(request.service)}<br /><span class="muted">${escapeHtml(request.serviceCode)}</span></div><div class="detail-cell"><label>Provider</label>${escapeHtml(request.provider)}</div><div class="detail-cell"><label>Deadline</label>${toLocalTime(request.deadline)} CT<br /><strong class="${risk.level}">${request.open ? formatRemaining(timeRemainingHours(request, state.now)) : "Closed"}</strong></div><div class="detail-cell"><label>Channel</label>${titleCase(request.channel)}</div><div class="detail-cell"><label>Owner</label>${escapeHtml(request.assignedTo || "Unassigned")}</div></div>
    <h3>Clinical and documentation evidence</h3><div class="check-evidence">${escapeHtml(request.evidence || "No demonstration evidence available.")}</div><div class="small-stack" style="margin-top:10px">${(SERVICE_REQUIREMENTS[request.serviceFamily] || []).map((document) => `<div class="inline">${request.documents?.includes(document) ? `<span class="tag ok">${icon("check")} Present</span>` : `<span class="tag warn">${icon("alert")} Missing</span>`}<span class="compact">${document}</span></div>`).join("")}</div>
    <div class="divider"></div><h3>Traceability</h3><div class="timeline">${request.events.map((event) => `<div class="timeline-item"><div class="timeline-time">Demo event</div><div class="timeline-copy">${escapeHtml(event)}</div></div>`).join("")}</div>
    ${request.breach ? `<div class="divider"></div><section class="decision-box"><h3>Late-decision cause review</h3><p class="helper">Every breach requires a root-cause record in the source-defined control model.</p>${request.rootCause ? `<div class="success-banner">${icon("check")}<div><strong>Cause recorded</strong><br />${escapeHtml(request.rootCause)}</div></div>` : `<><label for="cause-${request.id}">Root cause</label><select id="cause-${request.id}"><option value="Capacity or staffing">Capacity or staffing</option><option value="Intake delay">Intake delay</option><option value="Provider wait">Provider wait</option><option value="Routing error">Routing error</option><option value="System issue">System issue</option></select><button class="button danger" data-action="record-root-cause" data-id="${request.id}">Record required investigation</button></>`}</section>` : ""}
    ${request.status === "pending-information" ? `<div class="divider"></div><div class="${request.attested ? "attestation" : "notice"}"><strong>${request.attested ? "Provider attestation requires verification." : "Coordinator-owned next step."}</strong><br />${request.attested ? "The office states the flagged document is already present. A coordinator must verify it within four business hours; an attestation does not clear the checker flag automatically." : "Itemised outreach is already recorded. Mark documentation received to route this standard request to deadline-first clinical review."}</div><div class="drawer-footer"><button class="button secondary" data-action="send-reminder" data-id="${request.id}">Send reminder</button><button class="button primary" data-action="mark-docs" data-id="${request.id}">${icon("check")}Verify & route</button></div>` : ""}
    ${request.status === "probable-duplicate" ? `<div class="divider"></div><div class="notice"><strong>Human confirmation required.</strong><br />This match differs by code, provider or site. Do not merge automatically; both regulatory clocks continue.</div><div class="drawer-footer"><button class="button secondary" data-action="reject-duplicate" data-id="${request.id}">Not a duplicate</button><button class="button primary" data-action="confirm-duplicate" data-id="${request.id}">${icon("merge")}Confirm & merge</button></div>` : ""}
    ${canDecide ? `<div class="divider"></div><section class="decision-box"><h3>Clinician decision</h3><label for="decision-${request.id}">Outcome</label><select id="decision-${request.id}"><option value="approve">Approve against checklist</option><option value="deny">Clinical denial</option><option value="pend">Return to pend desk</option></select><label for="rationale-${request.id}">Decision rationale</label><textarea id="rationale-${request.id}" placeholder="Record the supporting evidence or criterion."></textarea>${requiresSecond ? `<div class="notice">${secondDone ? "Second clinician review recorded. A denial may now be completed in this demonstration." : "A clinical denial in this service requires a second clinician review before it can be completed."}</div>` : ""}</section><div class="drawer-footer">${requiresSecond && !secondDone ? `<button class="button secondary" data-action="second-review" data-id="${request.id}">Record second clinician review</button>` : ""}<button class="button primary" data-action="save-decision" data-id="${request.id}">${icon("check")}Record decision</button></div>` : ""}
    ${request.status === "denied" ? `<div class="divider"></div><div class="notice"><strong>Denial record</strong><br />${escapeHtml(request.denialReason || "Clinical criteria not met.")}<br /><span class="muted">${escapeHtml(request.denialCriterion || "Specific criterion stored in the record.")}</span></div>${request.reopenEligible ? `<div class="drawer-footer"><button class="button primary" data-action="reopen" data-id="${request.id}">${icon("refresh")}Reopen with documentation</button></div>` : ""}` : ""}
  </aside></div>`;
}

function renderClockDrawer() {
  return `<div class="modal-backdrop" data-action="close-clock"><aside class="drawer" role="dialog" aria-modal="true" aria-label="Simulation clock" data-drawer><header class="drawer-header"><div><div class="eyebrow">Accelerated demo control</div><div class="request-title">Advance operational time</div><p class="lede">Scheduled rules, alerts, deadline risk and investigation tasks update when time moves.</p></div><button class="close-button" aria-label="Close" data-action="close-clock">×</button></header><div class="sim-control"><span>Current demo time: <strong>${nowLabel()}</strong></span></div><div class="divider"></div><div class="small-stack"><button class="button primary" data-action="advance-clock" data-hours="1">Advance 1 hour</button><button class="button secondary" data-action="advance-clock" data-hours="24">Advance 24 hours</button><button class="button secondary" data-action="advance-clock" data-hours="48">Advance 48 hours</button><button class="button secondary" data-action="advance-to" data-target="day4">Advance to next day-4 escalation</button><button class="button secondary" data-action="advance-to" data-target="day6">Advance to next day-6 review</button><button class="button danger" data-action="advance-to" data-target="deadline">Advance past next deadline</button></div><div class="divider"></div><h3>Scheduled rules that will run</h3><div class="small-stack">${ruleLine("24", "Information reminder", "Standard pends get 24- and 48-hour reminder events.")}${ruleLine("4", "Coordinator escalation", "Unanswered standard pends receive a day-4 call task.")}${ruleLine("48", "Urgent escalation", "Undecided urgent cases alert the team lead at 48 hours.")}${ruleLine("0", "Breach investigation", "An overdue request receives an investigation record with a required root cause.")}</div><div class="drawer-footer"><button class="button secondary" data-action="reset-demo">${icon("refresh")}Reset demo</button></div></aside></div>`;
}

function render() {
  let content = "";
  if (state.page === "dashboard") content = dashboard();
  if (state.page === "submit") content = submitPage();
  if (state.page === "pend") content = pendPage();
  if (state.page === "queue") content = queuePage();
  if (state.page === "integrations") content = integrationPage();
  if (state.page === "insights") content = insightsPage();
  if (state.page === "governance") content = governancePage();
  if (state.page === "audit") content = auditPage();
  if (state.page === "financial") content = financialPage();
  if (state.page === "judge") content = judgePage();
  document.querySelector("#app").innerHTML = renderShell(content) + (state.clockOpen ? renderClockDrawer() : "") + renderDrawer();
  persistState();
  renderToasts();
}

function recordActivity(title, copy, kind = "info") {
  state.activities.unshift({ time: "Now", title, copy, kind });
}

function createRequest({ channel = "portal", input = state.form } = {}) {
  const service = input.service;
  const requirements = SERVICE_REQUIREMENTS[service];
  const documents = input.documents || requirements;
  const submittedAt = state.now;
  const serviceCodes = { imaging: "72148", physicalTherapy: "97110", equipment: "E0973", homeHealth: "G0299" };
  const existing = duplicateMatch({ memberId: input.memberId, serviceCode: serviceCodes[service], provider: input.provider, submittedAt }, state.requests);
  const probable = probableDuplicateMatch({ memberId: input.memberId, serviceFamily: service, submittedAt }, state.requests);
  const missing = missingDocuments(service, documents);
  const isUrgent = input.urgency === "urgent";
  if (input.coverage === "not-covered" || input.network === "out-of-network") {
    const reason = input.coverage === "not-covered" ? "Service is not covered under the selected benefit" : "Ordering provider is out of network";
    return { kind: "intercepted", reason, id: null };
  }
  if (existing) {
    const request = { id: nextRequestId(), member: input.member, memberId: input.memberId, provider: input.provider, group: "Demo provider", service: serviceLabel(service), serviceCode: serviceCodes[service], serviceFamily: service, channel, urgency: "standard", status: "merged", lane: "duplicate control", completeness: missing.length ? "incomplete" : "complete", missing, submittedAt, deadline: new Date(new Date(submittedAt).getTime() + 7 * 24 * 3_600_000).toISOString(), originalDeadline: new Date(new Date(submittedAt).getTime() + 7 * 24 * 3_600_000).toISOString(), open: false, duplicateOf: existing.id, notices: [`Merged into ${existing.id}; original clock retained`], documents, events: ["Exact duplicate merged automatically under rule D-1."], evidence: "Additional documents attached to original request.", lineOfBusiness: "Employer" };
    state.requests.unshift(request);
    existing.documents = [...new Set([...(existing.documents || []), ...documents])];
    existing.events.unshift(`Additional documents attached from exact duplicate ${request.id}.`);
    return { kind: "merged", request, original: existing };
  }
  const request = { id: nextRequestId(), member: input.member, memberId: input.memberId, provider: input.provider, group: "Demo provider", service: serviceLabel(service), serviceCode: serviceCodes[service], serviceFamily: service, channel, urgency: isUrgent ? "urgent" : "standard", status: isUrgent || !missing.length ? "clinical-review" : probable ? "probable-duplicate" : "pending-information", lane: isUrgent ? "urgent nurse queue" : !missing.length ? "nurse queue" : probable ? "coordinator confirmation" : "pend desk", completeness: missing.length ? "incomplete" : "complete", missing, submittedAt, deadline: new Date(new Date(submittedAt).getTime() + (isUrgent ? 72 : 168) * 3_600_000).toISOString(), open: true, assignedTo: isUrgent ? "Urgent nurse (unassigned)" : !missing.length ? "Unassigned" : "Intake coordinator", notices: ["Acknowledgement created"], documents, events: [], evidence: missing.length ? `Checker found: ${missing.join(", ")}.` : "Demonstrative document checklist completed.", lineOfBusiness: "Employer" };
  if (probable && !isUrgent && !missing.length) { request.probableOf = probable.id; request.events.push(`Probable duplicate of ${probable.id}; human confirmation required.`); }
  else if (isUrgent) request.events.push("Urgent request bypassed completeness hold and entered urgent nurse queue.");
  else if (missing.length) {
    request.events.push(input.attest ? "Provider attested that flagged documentation is present; coordinator verification required within four business hours." : "Checker issued itemised information request; coordinator owns outreach.");
    if (input.attest) { request.attested = true; request.notices.push("Attestation acknowledgement created; coordinator verification pending."); }
  }
  else request.events.push("Complete request entered deadline-first clinical queue.");
  state.requests.unshift(request);
  return { kind: request.status, request };
}

function submitPortal() {
  const { member, memberId, provider } = state.form;
  if (!member.trim() || !memberId.trim() || !provider.trim()) { toast("Add member, member ID and ordering provider before routing the request.", "warn"); return; }
  const outcome = createRequest({ channel: state.form.channel, input: state.form });
  if (outcome.kind === "intercepted") {
    toast(`Request was stopped before submission: ${outcome.reason}. This is not a clinical denial.`, "warn");
  } else if (outcome.kind === "merged") {
    toast(`${outcome.request.id} merged into ${outcome.original.id}; no duplicate denial was issued.`, "good"); state.selectedRequest = outcome.original.id;
  } else {
    toast(`${outcome.request.id} acknowledged and routed to ${outcome.request.lane}.`, "good"); state.selectedRequest = outcome.request.id;
  }
  state.form = { member: "", memberId: "", provider: "", service: "imaging", channel: "portal", urgency: "standard", coverage: "covered", network: "in-network", documents: [], attest: false };
  render();
}

function markDocs(id) {
  const request = requestById(id); if (!request) return;
  request.documents = [...new Set([...(request.documents || []), ...(SERVICE_REQUIREMENTS[request.serviceFamily] || [])])];
  request.missing = []; request.completeness = "complete"; request.status = "clinical-review"; request.lane = request.urgency === "urgent" ? "urgent nurse queue" : "nurse queue"; request.assignedTo = "Unassigned"; request.events.unshift("Coordinator verified documentation; request entered deadline-first clinical review."); request.notices.unshift("Documentation received acknowledgement created."); recordActivity("Documentation completed", `${id} moved from the pend desk to the clinical queue.`); state.selectedRequest = null; toast(`${id} is now ready for clinical review.`, "good"); render();
}

function sendReminder(id) {
  const request = requestById(id); if (!request) return;
  request.notices.unshift(`Reminder issued at ${nowLabel()}`); request.events.unshift("Coordinator reminder sent through the originating channel."); recordActivity("Information reminder sent", `${id} was contacted using the original submission channel.`); toast(`Reminder recorded for ${id}.`, "good"); render();
}

function confirmDuplicate(id) {
  const request = requestById(id); if (!request) return;
  const original = requestById(request.probableOf) || state.requests.find((item) => item.id !== id && item.memberId === request.memberId && item.open);
  request.status = "merged"; request.open = false; request.lane = "duplicate control"; request.duplicateOf = original?.id || "matched original"; request.events.unshift(`Probable duplicate confirmed by intake coordinator; merged into ${request.duplicateOf}.`); request.notices.unshift(`Merged into ${request.duplicateOf}; original clock retained.`); if (original) original.documents = [...new Set([...(original.documents || []), ...(request.documents || [])])]; recordActivity("Probable duplicate confirmed", `${id} merged after coordinator review; no denial issued.`); state.selectedRequest = null; toast(`${id} merged after human confirmation.`, "good"); render();
}

function rejectDuplicate(id) {
  const request = requestById(id); if (!request) return;
  request.status = "clinical-review"; request.lane = "nurse queue"; request.assignedTo = "Unassigned"; delete request.probableOf; request.events.unshift("Coordinator rejected probable duplicate; request entered clinical review."); recordActivity("Probable duplicate rejected", `${id} remains an independent request with its own deadline.`); state.selectedRequest = null; toast(`${id} remains a separate request.`, "good"); render();
}

function unmerge(id) {
  const request = requestById(id); if (!request) return;
  request.status = request.completeness === "complete" ? "clinical-review" : "pending-information"; request.lane = request.status === "clinical-review" ? "nurse queue" : "pend desk"; request.open = true; request.deadline = request.originalDeadline || request.deadline; request.assignedTo = "Unassigned"; request.events.unshift("Merge reversed; original request data and clock restored."); request.notices.unshift("Un-merge recorded for audit."); recordActivity("Merge reversed", `${id} was restored with its original regulatory clock.`); toast(`${id} restored as an independent request.`, "good"); render();
}

function reopen(id) {
  const request = requestById(id); if (!request) return;
  request.reopened = true; request.open = true; request.status = "clinical-review"; request.lane = "reopening nurse queue"; request.completeness = "complete"; request.missing = []; request.deadline = new Date(new Date(state.now).getTime() + 72 * 3_600_000).toISOString(); request.assignedTo = "Nurse reopening desk"; request.events.unshift("Qualifying documentation received within 14 days; original request reopened with a 72-hour decision clock."); request.notices.unshift("Reopening acknowledgement created."); recordActivity("Request reopened", `${id} now follows the documented 72-hour reopening pathway.`); state.selectedRequest = id; toast(`${id} reopened; new 72-hour decision clock started.`, "good"); render();
}

function recordDecision(id) {
  const request = requestById(id); if (!request) return;
  const select = document.querySelector(`#decision-${id}`); const rationale = document.querySelector(`#rationale-${id}`)?.value.trim(); const decision = select?.value || "approve";
  if (decision === "pend") { request.status = "pending-information"; request.lane = "pend desk"; request.completeness = "incomplete"; request.missing = request.missing.length ? request.missing : ["Additional clinical documentation"]; request.events.unshift("Nurse identified an information gap; pend desk owns outreach."); request.notices.unshift("Itemised information request created from nurse finding."); state.selectedRequest = null; toast(`${id} returned to the pend desk.`, "good"); render(); return; }
  if (decision === "deny" && ["imaging", "physicalTherapy", "equipment"].includes(request.serviceFamily) && !state.secondReview[id]) { toast("Record the required second clinician review before completing this clinical denial.", "warn"); return; }
  request.open = false; request.decisionAt = state.now; request.assignedTo = "Nurse R. Khan";
  if (decision === "approve") { request.status = "approved"; request.lane = "decision complete"; request.decisionType = "nurse approval"; request.authorization = `AUTH-${Math.floor(700000 + Math.random() * 200000)}`; request.events.unshift(`Nurse approved against checklist.${rationale ? ` Rationale: ${rationale}` : ""}`); request.notices.unshift(`Approval notice created with ${request.authorization}.`); toast(`${id} approved and authorisation recorded.`, "good"); }
  else { request.status = "denied"; request.lane = "decision complete"; request.denialReason = rationale || "Clinical criteria not demonstrated in the available record"; request.denialCriterion = "Specific clinical criterion and information that would change the decision are recorded in this demonstration."; request.events.unshift("Clinical denial recorded by a licensed clinician after required quality controls."); request.notices.unshift("Denial notice with reason, criterion and next steps created."); toast(`${id} denial recorded with a specific rationale.`, "good"); }
  recordActivity(`Clinical decision recorded`, `${id} was ${decision === "approve" ? "approved" : "denied"} in the synthetic workflow.`); state.selectedRequest = null; render();
}

function advanceTime(hours) {
  const before = state.now; state.now = new Date(new Date(state.now).getTime() + hours * 3_600_000).toISOString(); let triggered = 0;
  state.requests.filter((request) => request.open).forEach((request) => {
    const beforeElapsed = (new Date(before) - new Date(request.submittedAt)) / 3_600_000; const afterElapsed = (new Date(state.now) - new Date(request.submittedAt)) / 3_600_000;
    const beforeRemaining = timeRemainingHours(request, before); const afterRemaining = timeRemainingHours(request, state.now);
    if (request.status === "pending-information") {
      [[24, "24-hour reminder issued by scheduled workflow."], [48, "48-hour reminder issued by scheduled workflow."], [96, "Day-4 coordinator call task escalated."]].forEach(([threshold, message]) => { if (beforeElapsed < threshold && afterElapsed >= threshold) { request.events.unshift(message); request.notices.unshift(message); triggered += 1; } });
    }
    if (request.urgency === "urgent") {
      [[24, "24-hour urgent assignment check triggered."], [48, "48-hour urgent alert escalated to team lead."], [60, "60-hour urgent escalation sent to UM director and on-call physician."]].forEach(([threshold, message]) => { if (beforeElapsed < threshold && afterElapsed >= threshold) { request.events.unshift(message); triggered += 1; } });
    }
    if (request.urgency === "standard" && beforeRemaining > 24 && afterRemaining <= 24 && afterRemaining > 0) { request.events.unshift("Day-6 at-risk review added for team lead."); triggered += 1; }
    if (beforeRemaining > 0 && afterRemaining <= 0) { request.breach = true; request.events.unshift("Deadline breach recorded. Root-cause investigation required before closure."); request.notices.unshift("At-risk or late-decision notice created."); triggered += 1; }
  });
  if (triggered) recordActivity("Demo clock advanced", `${triggered} scheduled rule${triggered === 1 ? "" : "s"} ran against the synthetic request state.`, "alert");
  state.clockOpen = false; render(); toast(`Demo time advanced by ${hours} hour${hours === 1 ? "" : "s"}; ${triggered} workflow event${triggered === 1 ? "" : "s"} ran.`, triggered ? "warn" : "good");
}

function advanceTo(target) {
  const now = new Date(state.now).getTime();
  const candidates = state.requests.filter((request) => request.open).map((request) => {
    const elapsed = (now - new Date(request.submittedAt).getTime()) / 3_600_000;
    let hours = Infinity;
    if (target === "day4" && request.status === "pending-information" && elapsed < 96) hours = 96 - elapsed;
    if (target === "day6" && request.urgency === "standard" && timeRemainingHours(request, state.now) > 24) hours = timeRemainingHours(request, state.now) - 24;
    if (target === "deadline") hours = Math.max(1, timeRemainingHours(request, state.now) + 1);
    return hours;
  }).filter((hours) => Number.isFinite(hours) && hours > 0);
  if (!candidates.length) { toast("No matching scheduled point remains in the current simulation.", "warn"); return; }
  advanceTime(Math.ceil(Math.min(...candidates)));
}

function apiAction(type) {
  const group = state.selectedIntegration;
  if (type === "outage") { state.integrationState[group] = "outage"; state.apiResponse = apiTemplate(group, "outage"); recordActivity("Integration fallback activated", `${group} is using the portal fallback in the synthetic scenario.`, "alert"); toast(`Simulated outage: ${group} moved to portal fallback.`, "warn"); render(); return; }
  if (type === "recover") { state.integrationState[group] = "connected"; state.apiResponse = apiTemplate(group, "connected"); recordActivity("Integration recovered", `${group} mock connection returned to service.`, "info"); toast(`${group} mock connection recovered.`, "good"); render(); return; }
  if (type === "invalid") { state.apiResponse = { contract: "complete-first/v0.1", response: { status: 422, state: "rejected", code: "missing_member_identifier", detail: "Member identifier is required. No request was created." } }; toast("Invalid API sample produced a meaningful 422 response.", "warn"); render(); return; }
  if (type === "status") { const request = requestById("PA-24021"); state.apiResponse = { contract: "complete-first/v0.1", response: { status: 200, requestId: request.id, state: "in_review", expectedDecisionBy: request.deadline, route: request.lane } }; toast("Status response loaded for PA-24021.", "good"); render(); return; }
  if (type === "submit") {
    if (state.apiPending) return;
    state.apiPending = true;
    render();
    window.setTimeout(() => { state.apiPending = false; apiAction("submit-confirm"); }, 520);
    return;
  }
  if (type === "submit-confirm") {
    if (state.integrationState[group] === "outage") { state.apiResponse = apiTemplate(group, "outage"); toast("Connection is degraded; use the configured portal fallback.", "warn"); render(); return; }
    const outcome = createRequest({ channel: "api", input: { member: "Taylor Morgan", memberId: "M-208114", provider: group, service: "physicalTherapy", urgency: "standard", coverage: "covered", network: "in-network", documents: SERVICE_REQUIREMENTS.physicalTherapy } });
    state.apiResponse = { contract: "complete-first/v0.1", response: { status: 202, requestId: outcome.request.id, state: "in_review", expectedDecisionBy: outcome.request.deadline, duplicateCheck: "clear", documentCheck: "complete" } }; recordActivity("API request acknowledged", `${outcome.request.id} was created through the ${group} simulated connection.`, "info"); toast(`${outcome.request.id} was accepted through the simulated API.`, "good"); render();
  }
}

function launchScenario(id) {
  state.scenarioSelected = id;
  state.clockOpen = false;
  state.selectedRequest = null;
  const request = (requestId) => requestById(requestId);
  if (id === "incomplete") {
    state.page = "submit";
    state.form = { member: "Taylor Morgan", memberId: "M-208114", provider: "Harbor Orthopedics", service: "imaging", channel: "portal", urgency: "standard", coverage: "covered", network: "in-network", documents: ["Clinical note", "Imaging order"], attest: false };
  }
  if (id === "attestation") {
    const item = request("PA-24018"); if (item) { item.attested = true; if (!item.events.some((event) => event.includes("attested"))) item.events.unshift("Provider attested that conservative-therapy evidence is on page 4; coordinator verification is pending."); }
    state.page = "pend"; state.selectedRequest = "PA-24018";
  }
  if (id === "exact") { state.page = "audit"; state.selectedRequest = "PA-24030"; }
  if (id === "probable") { state.page = "pend"; state.selectedRequest = "PA-24031"; }
  if (id === "urgent") { state.page = "queue"; state.selectedRequest = "PA-24023"; }
  if (id === "breach") {
    state.now = "2026-12-20T02:00:00.000Z";
    const item = request("PA-24023"); if (item && !item.breach) { item.breach = true; item.events.unshift("Deadline breach recorded. Root-cause investigation required before closure."); item.notices.unshift("At-risk or late-decision notice created."); }
    state.page = "queue"; state.selectedRequest = "PA-24023";
  }
  if (id === "reopen") { state.page = "audit"; state.selectedRequest = "PA-24015"; }
  if (id === "api") { state.page = "integrations"; state.selectedIntegration = "Evergreen Health System"; state.integrationState["Evergreen Health System"] = "outage"; state.apiResponse = apiTemplate("Evergreen Health System", "outage"); }
  if (["gold", "gate"].includes(id)) { state.page = "governance"; }
  if (id === "kill") { state.page = "governance"; state.aiKillSwitchTested = true; state.aiManualRouting = true; }
  if (id === "stress") {
    state.now = "2026-12-20T02:00:00.000Z";
    const urgent = request("PA-24023"); if (urgent && !urgent.breach) { urgent.breach = true; urgent.events.unshift("Deadline breach recorded in workload-stress fixture; root-cause investigation required."); }
    state.page = "dashboard";
  }
  recordActivity("Judge scenario launched", `${id} scenario loaded in the connected synthetic workspace.`, id === "stress" || id === "api" || id === "kill" ? "alert" : "info");
  render();
  toast(`Loaded judge scenario: ${id}.`, "good");
}

function handleClick(event) {
  const target = event.target.closest("[data-action]"); if (!target) return;
  const action = target.dataset.action; const id = target.dataset.id;
  if (action === "navigate") { state.page = target.dataset.page; state.selectedRequest = null; render(); return; }
  if (action === "metric-detail") { state.metricFocus = target.dataset.metric; render(); return; }
  if (action === "route-focus") {
    const route = target.dataset.route; state.routeFocus = route;
    const routeMap = { complete: ["queue", "PA-24029"], incomplete: ["pend", "PA-24018"], urgent: ["queue", "PA-24023"], duplicate: ["audit", "PA-24030"], failure: ["integrations", null] };
    const [page, requestId] = routeMap[route] || ["dashboard", null]; state.page = page; state.selectedRequest = requestId; if (route === "failure") { state.selectedIntegration = "Evergreen Health System"; state.integrationState["Evergreen Health System"] = "outage"; state.apiResponse = apiTemplate("Evergreen Health System", "outage"); } render(); return;
  }
  if (action === "select-scenario") { state.scenarioSelected = target.dataset.scenario; render(); return; }
  if (action === "launch-scenario") return launchScenario(target.dataset.scenario);
  if (action === "open-request") { state.selectedRequest = id; state.clockOpen = false; render(); return; }
  if (action === "close-drawer") { if (event.target.closest("[data-drawer]") && event.target !== target) return; state.selectedRequest = null; render(); return; }
  if (action === "open-clock") { state.clockOpen = true; state.selectedRequest = null; render(); return; }
  if (action === "close-clock") { if (event.target.closest("[data-drawer]") && event.target !== target) return; state.clockOpen = false; render(); return; }
  if (action === "clear-form") { state.form = { member: "", memberId: "", provider: "", service: "imaging", channel: "portal", urgency: "standard", coverage: "covered", network: "in-network", documents: [], attest: false }; render(); return; }
  if (action === "send-reminder") return sendReminder(id);
  if (action === "mark-docs") return markDocs(id);
  if (action === "confirm-duplicate") return confirmDuplicate(id);
  if (action === "reject-duplicate") return rejectDuplicate(id);
  if (action === "unmerge") return unmerge(id);
  if (action === "reopen") return reopen(id);
  if (action === "record-root-cause") {
    const item = requestById(id);
    const selection = document.querySelector(`#cause-${id}`);
    if (item) {
      item.rootCause = selection?.value || "Capacity or staffing";
      item.events.unshift(`Root-cause investigation recorded: ${item.rootCause}.`);
      recordActivity("Late-decision cause recorded", `${id} breach root cause: ${item.rootCause}.`, "alert");
      toast(`Root-cause record saved for ${id}.`, "good");
    }
    render();
    return;
  }
  if (action === "second-review") { state.secondReview[id] = true; const request = requestById(id); if (request) request.events.unshift("Second clinician review recorded in demo workflow."); toast("Second clinician review recorded; denial control satisfied.", "good"); render(); return; }
  if (action === "save-decision") return recordDecision(id);
  if (action === "advance-clock") return advanceTime(Number(target.dataset.hours));
  if (action === "advance-to") return advanceTo(target.dataset.target);
  if (action === "reset-demo") return resetState();
  if (action === "select-integration") { state.selectedIntegration = target.dataset.name; state.apiResponse = null; render(); return; }
  if (action === "api-submit") return apiAction("submit");
  if (action === "api-invalid") return apiAction("invalid");
  if (action === "api-outage") return apiAction("outage");
  if (action === "api-recover") return apiAction("recover");
  if (action === "api-status") return apiAction("status");
  if (action === "test-kill-switch") { state.aiKillSwitchTested = true; state.aiManualRouting = true; recordActivity("AI kill-switch drill completed", "Synthetic fail-safe routing to nurses was recorded; G4 remains blocked.", "alert"); toast("Kill-switch drill recorded. All AI traffic is routed to nurses; G4 remains blocked.", "good"); render(); return; }
}

function handleInput(event) {
  const target = event.target;
  if (target.dataset.input === "metric-channel") { state.metricChannel = target.value; render(); return; }
  if (target.dataset.input === "audit-select") { state.selectedRequest = target.value; render(); return; }
  if (target.dataset.input === "financial-appeal") { state.financialAppealRate = Number(target.value); render(); return; }
  if (target.dataset.formField) {
    const field = target.dataset.formField;
    if (field === "urgency") state.form.urgency = target.checked ? "urgent" : "standard";
    else if (field === "attest") state.form.attest = target.checked;
    else state.form[field] = target.value;
    if (["service", "coverage", "network", "urgency", "attest"].includes(field)) render();
    return;
  }
  if (target.dataset.document) { const document = target.dataset.document; state.form.documents = target.checked ? [...state.form.documents, document] : state.form.documents.filter((item) => item !== document); render(); }
}

document.addEventListener("click", handleClick);
document.addEventListener("change", handleInput);
document.addEventListener("input", (event) => {
  const target = event.target;
  if (target.dataset.input === "financial-appeal") { state.financialAppealRate = Number(target.value); render(); return; }
  if (target.dataset.formField && target.dataset.formField !== "urgency" && target.dataset.formField !== "attest") state.form[target.dataset.formField] = target.value;
});
document.addEventListener("submit", (event) => { if (event.target.id === "submission-form") { event.preventDefault(); submitPortal(); } });
document.addEventListener("keydown", (event) => { if (event.key === "Escape") { if (state.selectedRequest || state.clockOpen) { state.selectedRequest = null; state.clockOpen = false; render(); } } });

render();
