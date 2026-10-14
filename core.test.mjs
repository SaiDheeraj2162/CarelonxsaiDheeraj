import assert from "node:assert/strict";
import test from "node:test";
import { deadlineOrder, deriveMetrics, duplicateMatch, missingDocuments, riskFor } from "../core.mjs";

const now = "2026-12-18T14:00:00.000Z";

function request(overrides = {}) {
  return {
    id: "PA-1", memberId: "M-1", serviceCode: "72148", serviceFamily: "imaging", provider: "Demo Clinic", submittedAt: "2026-12-17T12:00:00.000Z", deadline: "2026-12-19T00:00:00.000Z", urgency: "standard", status: "clinical-review", completeness: "complete", channel: "portal", open: true,
    ...overrides,
  };
}

test("document checker reports only the requirements that are absent", () => {
  assert.deepEqual(missingDocuments("imaging", ["Clinical note", "Imaging order"]), ["6 weeks conservative therapy"]);
});

test("urgent request in its last 12 hours is correctly marked at risk", () => {
  const urgent = request({ urgency: "urgent", deadline: "2026-12-19T01:00:00.000Z" });
  assert.equal(riskFor(urgent, now).level, "critical");
});

test("deadline queue orders by time remaining rather than provider attributes", () => {
  const later = request({ id: "PA-later", deadline: "2026-12-22T00:00:00.000Z", provider: "Large Account" });
  const sooner = request({ id: "PA-sooner", deadline: "2026-12-18T20:00:00.000Z", provider: "Small Practice" });
  assert.deepEqual(deadlineOrder([later, sooner], now).map((item) => item.id), ["PA-sooner", "PA-later"]);
});

test("exact duplicate requires same member, service, provider, open status and 30-day window", () => {
  const original = request();
  assert.equal(duplicateMatch({ memberId: "M-1", serviceCode: "72148", provider: "Demo Clinic", submittedAt: "2026-12-18T10:00:00.000Z" }, [original]).id, "PA-1");
  assert.equal(duplicateMatch({ memberId: "M-1", serviceCode: "72148", provider: "Another Clinic", submittedAt: "2026-12-18T10:00:00.000Z" }, [original]), undefined);
});

test("metrics are derived from the same request records and channel filter", () => {
  const requests = [request({ id: "PA-api", channel: "api", status: "pending-information", completeness: "incomplete" }), request({ id: "PA-fax", channel: "fax", deadline: "2026-12-18T12:00:00.000Z" })];
  const all = deriveMetrics(requests, now);
  const api = deriveMetrics(requests, now, "api");
  assert.equal(all.open, 2);
  assert.equal(all.pending, 1);
  assert.equal(all.late, 1);
  assert.equal(api.total, 1);
  assert.equal(api.apiRate, 100);
});
