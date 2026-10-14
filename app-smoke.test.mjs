import assert from "node:assert/strict";
import test from "node:test";

test("dashboard, Judge mode and breach investigation render from one shared state", async () => {
  const listeners = {};
  const app = { innerHTML: "" };
  const rootCause = { value: "System issue" };

  globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
  globalThis.window = { setTimeout: () => 0 };
  globalThis.document = {
    body: { appendChild: () => {} },
    querySelector: (selector) => {
      if (selector === "#app") return app;
      if (selector === "#cause-PA-24023") return rootCause;
      return null;
    },
    createElement: () => ({ className: "", innerHTML: "" }),
    addEventListener: (type, callback) => { listeners[type] = callback; },
  };

  await import(`../script.js?smoke=${Date.now()}`);
  assert.match(app.innerHTML, /Operations command center/);

  const click = (dataset) => listeners.click({ target: { closest: () => ({ dataset }) } });
  click({ action: "navigate", page: "judge" });
  assert.match(app.innerHTML, /Judge mode/);
  assert.match(app.innerHTML, /12\. Workload stress/);

  click({ action: "launch-scenario", scenario: "breach" });
  assert.match(app.innerHTML, /Late-decision cause review/);

  click({ action: "record-root-cause", id: "PA-24023" });
  assert.match(app.innerHTML, /Cause recorded/);
  assert.match(app.innerHTML, /System issue/);
});
