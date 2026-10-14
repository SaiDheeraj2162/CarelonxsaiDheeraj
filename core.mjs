export const SERVICE_REQUIREMENTS = {
  imaging: ["Clinical note", "6 weeks conservative therapy", "Imaging order"],
  physicalTherapy: ["Evaluation", "Treatment plan", "Functional limitation"],
  equipment: ["Face-to-face note", "Prescription", "Functional need"],
  homeHealth: ["Plan of care", "Face-to-face note", "Homebound attestation"],
};

export function timeRemainingHours(request, now) {
  return Math.round((new Date(request.deadline).getTime() - new Date(now).getTime()) / 3_600_000);
}

export function riskFor(request, now) {
  if (!request.open) return { level: "resolved", label: "Resolved" };
  const hours = timeRemainingHours(request, now);
  if (hours <= 0) return { level: "late", label: "Breach" };
  if (request.urgency === "urgent") {
    if (hours <= 12) return { level: "critical", label: "Urgent at risk" };
    if (hours <= 24) return { level: "watch", label: "Urgent watch" };
    return { level: "normal", label: "Urgent on track" };
  }
  if (hours <= 24) return { level: "critical", label: "Day 6 at risk" };
  if (hours <= 72) return { level: "watch", label: "Approaching deadline" };
  return { level: "normal", label: "On track" };
}

export function formatRemaining(hours) {
  if (hours < 0) return `${Math.abs(hours)}h late`;
  const days = Math.floor(hours / 24);
  const remainder = hours % 24;
  return days ? `${days}d ${remainder}h left` : `${remainder}h left`;
}

export function missingDocuments(service, documents) {
  const requirementSet = SERVICE_REQUIREMENTS[service] || [];
  return requirementSet.filter((item) => !documents.includes(item));
}

export function duplicateMatch(submission, requests) {
  return requests.find((request) => (
    request.open
    && request.memberId === submission.memberId
    && request.serviceCode === submission.serviceCode
    && request.provider === submission.provider
    && Math.abs(new Date(request.submittedAt) - new Date(submission.submittedAt)) <= 30 * 24 * 3_600_000
  ));
}

export function probableDuplicateMatch(submission, requests) {
  return requests.find((request) => (
    request.open
    && request.memberId === submission.memberId
    && request.serviceFamily === submission.serviceFamily
    && Math.abs(new Date(request.submittedAt) - new Date(submission.submittedAt)) <= 30 * 24 * 3_600_000
  ));
}

export function deriveMetrics(requests, now, channel = "all") {
  const included = requests.filter((request) => channel === "all" || request.channel === channel);
  const open = included.filter((request) => request.open);
  const pending = open.filter((request) => request.status === "pending-information");
  const clinical = open.filter((request) => request.status === "clinical-review");
  const urgent = open.filter((request) => request.urgency === "urgent");
  const atRisk = open.filter((request) => ["critical", "late"].includes(riskFor(request, now).level));
  const urgentAtRisk = urgent.filter((request) => ["critical", "late"].includes(riskFor(request, now).level));
  const late = open.filter((request) => riskFor(request, now).level === "late");
  const complete = included.filter((request) => request.completeness === "complete");
  const denominator = included.length || 1;
  const api = included.filter((request) => request.channel === "api").length;
  const fax = included.filter((request) => request.channel === "fax").length;
  return {
    total: included.length,
    open: open.length,
    pending: pending.length,
    clinical: clinical.length,
    urgent: urgent.length,
    atRisk: atRisk.length,
    urgentAtRisk: urgentAtRisk.length,
    late: late.length,
    completeRate: Math.round((complete.length / denominator) * 100),
    apiRate: Math.round((api / denominator) * 100),
    faxRate: Math.round((fax / denominator) * 100),
    oldestOpenHours: open.length ? Math.max(...open.map((request) => Math.round((new Date(now) - new Date(request.submittedAt)) / 3_600_000))) : 0,
  };
}

export function deadlineOrder(requests, now) {
  return [...requests]
    .filter((request) => request.open && request.status === "clinical-review")
    .sort((left, right) => timeRemainingHours(left, now) - timeRemainingHours(right, now));
}
